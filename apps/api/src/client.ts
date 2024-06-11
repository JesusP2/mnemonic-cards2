import { hc } from 'hono/client'
import type { ping } from './app.js'

export const ping = hc<typeof app>('/')
export const route3 = hc<typeof route1>('/api')
