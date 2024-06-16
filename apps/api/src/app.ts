import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import * as z from 'zod';
import type { Env } from './types.js';
import { authRoute } from './routes/auth.js';

const app = new Hono<Env>().basePath('/api');

app.use('*', cors({ origin: 'http://localhost:3000' }));
app.use('*', logger());
app.use(csrf());
export const ping = app.get(
  '/ping',
  zValidator(
    'query',
    z.object({
      message: z.literal('ping'),
    }),
  ),
  async (c) => {
    return c.json({ message: 'pong' });
  },
);
app.route('/auth', authRoute)

// Custom Not Found Message
app.notFound((c) => {
  return c.text('Custom 404 Not Found', 404);
});

// Error handling
app.onError((err, c) => {
  console.error(`${err}`);
  return c.text('Custom Error Message', 500);
});

export default app;
