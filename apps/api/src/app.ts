import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { zValidator } from '@hono/zod-validator'
import * as z from 'zod'

const app = new Hono().basePath('/api');

app.use('*', logger())
export const ping = app.get('/ping',
  zValidator(
    'query',
    z.object({
      message: z.literal('ping')
    })),
    async (c) => {
      return c.json({ message: 'pong' })
})

// Custom Not Found Message
app.notFound((c) => {
  return c.text('Custom 404 Not Found', 404)
})

// Error handling
app.onError((err, c) => {
  console.error(`${err}`)
  return c.text('Custom Error Message', 500)
})

export default app;
