import { hc } from 'hono/client'
import type { ping } from './app.js'

const env = import.meta.env.PROD
const url = env ? '/' : 'http://localhost:8787'
export const pingRoute = hc<typeof ping>(url)
// export const route3 = hc<typeof route1>('/api')
