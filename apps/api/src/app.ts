import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import * as z from 'zod'

type Env = {
  Variables: {
    CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
  }
}
const app = new Hono<Env>().basePath('/api');

app.use('*', logger())
app.use('*', clerkMiddleware())
export const ping = app.get('/ping',
  zValidator(
    'query',
    z.object({
      message: z.literal('ping')
    })),
    async (c) => {
    const auth = getAuth(c)
      console.log('are you logged in?:', auth)
      return c.json({ message: 'pong' })
    }
)

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
