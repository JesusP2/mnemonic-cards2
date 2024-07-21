import { parseWithZod } from '@conform-to/zod';
import { Hono } from 'hono';
import { signinSchema, signupSchema } from '../../lib/schemas';
import {
  createUserSession,
  deleteAllUserSessions,
  deleteUserSessions,
} from '../data-access/sessions';
import { userModel } from '../data-access/users';
import { createUlid, hashPassword } from '../lucia';
import { authRateLimiter, rateLimitMiddleware } from '../utils/rate-limiter';

export const authRoute = new Hono();

authRoute.post('/signout', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.redirect('/auth/signin');
  }
  await deleteUserSessions(c, session.id);
  return c.redirect('/auth/signin');
});

authRoute.post('/signout-global', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.redirect('/auth/signin');
  }
  await deleteAllUserSessions(c, user.id);
  return c.redirect('/auth/signin');
});

authRoute.use(rateLimitMiddleware(authRateLimiter));

authRoute.post('/signin', async (c) => {
  if (c.get('user')) {
    return c.json(null, 403);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signinSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const user = await userModel.findByUsername(submission.value.username);
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
    await createUserSession(c, user.id);
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
  if (c.get('user')) {
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
    const user = await userModel.findByUsername(submission.value.username);
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
    await userModel.create({
      id: userId,
      username: submission.value.username,
      password: passwordHash,
      email: null,
      avatar: null,
    });
    await createUserSession(c, userId);
    return c.json(null, 200);
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
});
