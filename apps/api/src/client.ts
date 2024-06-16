import { hc } from 'hono/client';
import type { ping } from './app.js';
import type { signin, signup, emailVerification } from './routes/auth.js';

const env = import.meta.env.PROD;
const url = env ? '/' : 'http://localhost:8787';
export const pingRoute = hc<typeof ping>(url);
export const signinEndpoint = hc<typeof signin>(`${url}/auth`)
export const signupEndpoint = hc<typeof signup>(`${url}/auth`)
export const emailVeriricationEndpoint = hc<typeof emailVerification>(`${url}/auth`)
