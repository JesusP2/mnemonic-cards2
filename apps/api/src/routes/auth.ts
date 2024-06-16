import { createLuciaInstance, createUlid, hashPassword } from '@/lib/auth.js';
import { buildTursoClient } from '@/lib/db/pool.js';
import { emailVerificationTable, userTable } from '@/lib/db/schema/index.js';
import type { Env } from '@/types.js';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { getCookie, setCookie } from 'hono/cookie';
import { TimeSpan, createDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { z } from 'zod';

const authRoute = new Hono();

export const signin = authRoute.post(
  '/signin',
  zValidator(
    'json',
    z.object({
      username: z.string().min(3),
      password: z.string().min(8).max(255),
    }),
  ),
  async (c) => {
    const envs = env<Env['Variables']>(c);
    const lucia = createLuciaInstance(envs);
    const sessionId = getCookie(c, lucia.sessionCookieName);
    if (sessionId) {
      return c.redirect('/');
    }
    const { username, password } = c.req.valid('json');
    try {
      const db = buildTursoClient(envs);
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.username, username));
      const user = users[0];
      const hashedPassword = await hashPassword(password);
      if (!user || user.password !== hashedPassword) {
        return c.json({ message: 'Invalid credentials' }, 400);
      }
      const session = await lucia.createSession(user.id, {});
      const cookie = lucia.createSessionCookie(session.id);
      setCookie(c, cookie.name, cookie.value);
      return c.redirect('/');
    } catch (err) {
      return c.json({ message: 'Invalid credentials' }, 400);
    }
  },
);

export const signup = authRoute.post(
  '/signup',
  zValidator(
    'json',
    z.object({
      email: z.string().email().nullish(),
      username: z.string().min(3),
      password: z.string().min(8).max(255),
    }),
  ),
  async (c) => {
    const { email, username, password } = c.req.valid('json');
    const envs = env<Env['Variables']>(c);
    const lucia = createLuciaInstance(envs);
    const sessionId = getCookie(c, lucia.sessionCookieName);
    if (sessionId) {
      return c.redirect('/');
    }
    const hashedPassword = await hashPassword(password);
    const userId = createUlid();
    try {
      const db = buildTursoClient(envs);
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.username, username));
      const user = users[0];
      if (user) {
        return c.json({ message: 'User already exists' }, 400);
      }
      await db.insert(userTable).values({
        id: userId,
        username,
        email,
        password: hashedPassword,
      });
    } catch (err) {
      return c.json({ message: 'user already exists' }, 400);
    }
    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    setCookie(c, cookie.name, cookie.value);
    return c.redirect('/');
  },
);

export const emailVerification = authRoute.post(
  '/email-verification',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
    }),
  ),
  async (c) => {
    const envs = env<Env['Variables']>(c);
    const lucia = createLuciaInstance(envs);
    const db = buildTursoClient(envs);
    const { email } = c.req.valid('json');
    const sessionId = getCookie(c, lucia.sessionCookieName);
    if (!sessionId) {
      return c.json({ message: 'Not logged in' }, 403);
    }
    const { user } = await lucia.validateSession(sessionId);
    if (!user) {
      return c.json({ message: 'Not logged in' }, 403);
    }
    if (user.email) {
      return c.json({ message: 'email already verified' })
    }

    try {
      // send transaction and email
      await db
        .delete(emailVerificationTable)
        .where(eq(emailVerificationTable.userId, user.id));
      await db.insert(emailVerificationTable).values({
        id: createUlid(),
        userId: user.id,
        email: email,
        code: generateRandomString(5, alphabet('0-9')),
        expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
      });
      return c.json({ message: 'email sent' })
    } catch(err) {
      return c.json({ message: 'Could not create verification code' })
    }
  },
);
