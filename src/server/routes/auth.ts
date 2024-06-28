import { parseWithZod } from '@conform-to/zod';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { generateIdFromEntropySize } from 'lucia';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { z } from 'zod';
import {
  changePasswordSchema,
  codeSchema,
  profileSchema,
  resetTokenSchema,
  signinSchema,
  signupSchema,
  validateResetTokenSchema,
} from '../../lib/schemas';
import { db } from '../db/pool';
import {
  emailVerificationTable,
  resetTokenTable,
  userTable,
} from '../db/schema';
import { createUlid, hashPassword, lucia } from '../lucia';
import { checkUserLogin } from '../utils';

export const authRoute = new Hono();
authRoute.post('/signin', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (isUserLoggedIn.success) {
    return c.json(null, 403);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signinSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, submission.value.username));
    const user = users[0];
    const passwordHash = await hashPassword(submission.value.password);
    if (!user || user.password !== passwordHash) {
      return c.json(
        submission.reply({
          fieldErrors: {
            username: ['Invalid credentials'],
            password: ['Invalid credentials'],
          },
        }),
        400,
      );
    }
    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    setCookie(c, cookie.name, cookie.value, cookie.attributes);
    //doesnt matter what is returned as long as it's a 2xx code
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['Invalid credentials'],
          password: ['Invalid credentials'],
        },
      }),
      400,
    );
  }
});

authRoute.post('/signup', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (isUserLoggedIn.success) {
    return c.json(null, 403);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signupSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  const passwordHash = await hashPassword(submission.value.password);
  const userId = createUlid();
  try {
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, submission.value.username));
    const user = users[0];
    if (user) {
      return c.json(
        submission.reply({
          fieldErrors: {
            username: ['User already exists'],
          },
        }),
        400,
      );
    }
    await db.insert(userTable).values({
      id: userId,
      username: submission.value.username,
      password: passwordHash,
    });
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['User already exists'],
        },
      }),
      400,
    );
  }
  const session = await lucia.createSession(userId, {});
  const cookie = lucia.createSessionCookie(session.id);
  setCookie(c, cookie.name, cookie.value, cookie.attributes);
  return c.json(null, 200);
});

authRoute.put('/profile', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.json(null, 401);
  }
  const schema = profileSchema.superRefine((data, ctx) => {
    if (isUserLoggedIn.data?.user.email && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Required field',
      });
    }
  });
  const submission = parseWithZod(await c.req.formData(), { schema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  submission.value.email =
    submission.value.email === '' ? null : submission.value.email;
  const isUsernameBeingUpdated =
    submission.value.username !== isUserLoggedIn.data.user.username;
  const isEmailBeingUpdated =
    typeof submission.value.email === 'string' &&
    submission.value.email !== isUserLoggedIn.data.user.email;
  try {
    if (isUsernameBeingUpdated) {
      const users = await db
        .select({ username: userTable.username })
        .from(userTable)
        .where(eq(userTable.username, submission.value.username));
      if (users.length) {
        return c.json(
          submission.reply({
            fieldErrors: {
              username: ['User already exists'],
            },
          }),
          400,
        );
      }
    }
    if (isEmailBeingUpdated) {
      const users = await db
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.email, submission.value.email as string));
      if (users.length) {
        return c.json(
          submission.reply({
            fieldErrors: {
              email: ['Email is already being used'],
            },
          }),
          400,
        );
      }
    }
    await db.transaction(async (tx) => {
      if (isUsernameBeingUpdated) {
        await tx
          .update(userTable)
          .set({
            username: submission.value.username,
          })
          .where(eq(userTable.id, isUserLoggedIn.data.user.id));
      }
      if (isEmailBeingUpdated) {
        // TODO: send URL to email
        const code = generateRandomString(6, alphabet('0-9'));
        await tx
          .delete(emailVerificationTable)
          .where(
            eq(emailVerificationTable.userId, isUserLoggedIn.data.user.id),
          );
        await tx.insert(emailVerificationTable).values({
          id: createUlid(),
          code: code,
          userId: isUserLoggedIn.data.user.id,
          email: submission.value.email as string,
          expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
        });
      }
    });
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['Failed to update field, please try again'],
          email: ['Failed to update field, please try again'],
        },
      }),
      400,
    );
  }
  if (isEmailBeingUpdated) {
    return c.json({ message: 'email verification sent' }, 200);
  }
  return c.json(null, 200);
});

authRoute.post('/email-verification', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.json(null, 401);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, {
    schema: codeSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply());
  }

  const emailVerification = (
    await db
      .select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.code, submission.value.code),
          eq(emailVerificationTable.userId, isUserLoggedIn.data.user.id),
        ),
      )
  )[0];
  if (
    !emailVerification ||
    !isWithinExpirationDate(new Date(emailVerification.expiresAt))
  ) {
    // should tell them that code is invalid
    return c.json(
      submission.reply({
        fieldErrors: {
          code: ['Invalid code'],
        },
      }),
      403,
    );
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(emailVerificationTable)
        .where(eq(emailVerificationTable.userId, isUserLoggedIn.data.user.id));
      await tx
        .update(userTable)
        .set({
          email: emailVerification.email,
        })
        .where(eq(userTable.id, isUserLoggedIn.data.user.id));
    });
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      {
        message:
          'Could not validate email, this email is probably already being used',
      },
      400,
    );
  }
});

authRoute.post('/signout', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.redirect('/auth/signin');
  }
  await lucia.invalidateSession(isUserLoggedIn.data.session.id);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(c, blankSession.name, blankSession.value, blankSession.attributes);
  return c.redirect('/auth/signin');
});

authRoute.post('/signout-global', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.redirect('/auth/signin');
  }
  await lucia.invalidateUserSessions(isUserLoggedIn.data.user.id);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(c, blankSession.name, blankSession.value, blankSession.attributes);
  return c.redirect('/auth/signin')
});

authRoute.put('/password', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: changePasswordSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, isUserLoggedIn.data.user.id));
    const passwordHash = await hashPassword(submission.value.currentPassword);
    const user = users[0];
    if (!user || user.password !== passwordHash) {
      return c.json(
        submission.reply({
          fieldErrors: {
            currentPassword: ['Invalid password'],
          },
        }),
        400,
      );
    }
    await db.update(userTable).set({
      password: await hashPassword(submission.value.newPassword),
    });
    await lucia.invalidateUserSessions(isUserLoggedIn.data.user.id);
    const blankCookie = lucia.createBlankSessionCookie();
    setCookie(c, blankCookie.name, blankCookie.value, blankCookie.attributes);
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          currentPassword: ['Invalid password'],
        },
      }),
      400,
    );
  }
});

authRoute.post('/reset-password/email', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (isUserLoggedIn.success) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: resetTokenSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const users = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, submission.value.email));
    const user = users[0];
    if (!user) {
      return c.json(null, 200);
    }

    await db.delete(resetTokenTable).where(eq(resetTokenTable.userId, user.id));
    const tokenId = generateIdFromEntropySize(25); // 40 character
    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(tokenId)),
    );
    await db.insert(resetTokenTable).values({
      id: createUlid(),
      token: tokenHash,
      userId: user.id,
      expiresAt: createDate(new TimeSpan(2, 'h')).toISOString(),
    });
    const origin = c.req.header('origin');
    const url = `${origin}/auth/reset-password/${tokenId}`;
    console.log(url);
    // TODO: send URL to email
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          email: ['Something went wrong, please try again'],
        },
      }),
    );
  }
});

authRoute.post('/reset-password/token', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (isUserLoggedIn.success) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: validateResetTokenSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  const tokenHash = encodeHex(
    await sha256(new TextEncoder().encode(submission.value.token)),
  );
  const records = await db
    .select()
    .from(resetTokenTable)
    .where(eq(resetTokenTable.token, tokenHash));
  const record = records[0];
  if (!record || !isWithinExpirationDate(new Date(record.expiresAt))) {
    return c.json(submission.reply({
      fieldErrors: {
        password: ['Token expired']
      }
    }), 400);
  }
  await lucia.invalidateUserSessions(record.userId);
  const passwordHash = await hashPassword(submission.value.password);
  await db
    .update(userTable)
    .set({
      password: passwordHash,
    })
    .where(eq(userTable.id, record.userId));
  const session = await lucia.createSession(record.userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookie(
    c,
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return c.json(null, 200);
});
