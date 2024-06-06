import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono();

app.use('*', logger())
app.get('/', async (c) => {
	return c.json({ message: 'hi' })
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
