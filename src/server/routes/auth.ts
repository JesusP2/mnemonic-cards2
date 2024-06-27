import { parseWithZod } from '@conform-to/zod';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { TimeSpan, createDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { z } from 'zod';
import { profileSchema, signinSchema, signupSchema } from '../../lib/schemas';
import { db } from '../db/pool';
import { emailVerificationTable, userTable } from '../db/schema';
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
    const hashedPassword = await hashPassword(submission.value.password);
    if (!user || user.password !== hashedPassword) {
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
    setCookie(c, cookie.name, cookie.value);
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
  const hashedPassword = await hashPassword(submission.value.password);
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
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        username: submission.value.username,
        password: hashedPassword,
      });
      const code = generateRandomString(5, alphabet('0-9'));
      console.log(code);
      if (submission.value.email) {
        await tx.insert(emailVerificationTable).values({
          id: createUlid(),
          code: code,
          userId: userId,
          email: submission.value.email,
          expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
        });
      }
    });
  } catch (err) {
    console.error(err);
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
  setCookie(c, cookie.name, cookie.value);
  if (submission.value.email) {
    // TODO: needs to verify email, probably want to redirect them to a verify code page
    return c.json(null, 200);
  }
  return c.json(null, 200);
});

authRoute.put('/profile', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.json(null, 401);
  }
  const data = await c.req.formData();
  const username = data.get('username') as string;
  const email = data.get('email') as string;
  profileSchema.superRefine((data, ctx) => {
    if (isUserLoggedIn.data.user.email && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Required field',
      });
    }
  });
  await db.transaction(async (tx) => {
    if (username !== isUserLoggedIn.data.user.username) {
      await tx
        .update(userTable)
        .set({
          username: username,
        })
        .where(eq(userTable.id, isUserLoggedIn.data.user.id));
    }
    const code = generateRandomString(5, alphabet('0-9'));
    console.log(code);
    if (email) {
      await tx
        .delete(emailVerificationTable)
        .where(eq(emailVerificationTable.userId, isUserLoggedIn.data.user.id));
      await tx.insert(emailVerificationTable).values({
        id: createUlid(),
        code: code,
        userId: isUserLoggedIn.data.user.id,
        email: email,
        expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
      });
    }
  });
});

authRoute.post('/email-verification', async (c) => {
  const isUserLoggedIn = await checkUserLogin(c);
  if (!isUserLoggedIn.success) {
    return c.json(null, 401);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, {
    schema: z.object({ code: z.string().length(5) }),
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply());
  }

  const emailVerification = (
    await db
      .select({
        code: emailVerificationTable.code,
        email: emailVerificationTable.email,
      })
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.code, submission.value.code),
          eq(emailVerificationTable.userId, isUserLoggedIn.data.user.id),
        ),
      )
  )[0];
  if (!emailVerification) {
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
  setCookie(c, blankSession.name, blankSession.value);
  return c.redirect('/auth/signin');
});
