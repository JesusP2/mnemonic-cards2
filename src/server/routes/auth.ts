import { parseWithZod } from '@conform-to/zod';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { TimeSpan, createDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { z } from 'zod';
import { profileSchema, signupSchema } from '../../lib/schemas';
import { db } from '../db/pool';
import { emailVerificationTable, userTable } from '../db/schema';
import { createUlid, hashPassword, lucia } from '../lucia';

export const authRoute = new Hono();
authRoute.post('/signin', async (c) => {
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signupSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply());
  }
  const sessionId = getCookie(c, lucia.sessionCookieName);
  if (sessionId) {
    return c.json(null);
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
    return c.json(null);
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
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signupSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  const sessionId = getCookie(c, lucia.sessionCookieName);
  if (sessionId) {
    return c.json(null);
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
    await db.insert(userTable).values({
      id: userId,
      username: submission.value.username,
      email: submission.value.email,
      password: hashedPassword,
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
  setCookie(c, cookie.name, cookie.value);
  if (submission.value.email) {
    // TODO: needs to verify email
    return c.json(null);
  }
  return c.json(null);
});

authRoute.put('/profile', async (c) => {
  const sessionId = getCookie(c, lucia.sessionCookieName);
  if (!sessionId) {
    return c.json(
      {
        error: 'NotLoggedIn',
      },
      403,
    );
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return c.json(
      {
        error: 'NotLoggedIn',
      },
      403,
    );
  }
  const data = await c.req.formData();
  const username = data.get('username') as string;
  const email = data.get('email') as string;
  profileSchema.superRefine((data, ctx) => {
    if (user.email && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Required field',
      });
    }
  });
  db.transaction(async (tx) => {
    if (username !== user.username) {
      await tx
        .update(userTable)
        .set({
          username: username,
        })
        .where(eq(userTable.username, username));
    }
    if (email) {
      await tx.insert(emailVerificationTable).values({
        id: createUlid(),
        code: '12345',
        userId: user.id,
        email: email,
        expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
      });
    }
  });
});

authRoute.post('/email-verification', async (c) => {
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, {
    schema: z.object({ email: z.string().email() }),
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply());
  }
  const sessionId = getCookie(c, lucia.sessionCookieName);
  if (!sessionId) {
    return c.json(null);
    // return c.redirect('/auth/signin');
  }
  const { user } = await lucia.validateSession(sessionId);
  if (!user) {
    return c.json(null);
    // return c.redirect('/auth/signin');
  }
  if (user.email) {
    return c.json(null);
    // return c.redirect('/');
  }

  try {
    // TODO: send transaction and email
    await db
      .delete(emailVerificationTable)
      .where(eq(emailVerificationTable.userId, user.id));
    await db.insert(emailVerificationTable).values({
      id: createUlid(),
      userId: user.id,
      email: submission.value.email,
      code: generateRandomString(5, alphabet('0-9')),
      expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
    });
    return c.json({ message: 'email sent' });
  } catch (err) {
    return c.json({ message: 'Could not create verification code' });
  }
});

authRoute.post('/signout', async (c) => {
  const cookie = getCookie(c, lucia.sessionCookieName);
  if (!cookie) {
    return c.redirect('/auth/signin');
  }
  const { session } = await lucia.validateSession(cookie);
  if (session) {
    await lucia.invalidateSession(session.id);
  }
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(c, blankSession.name, blankSession.value);
  return c.redirect('/auth/signin');
});
