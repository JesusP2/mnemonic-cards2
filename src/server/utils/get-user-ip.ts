import type { Context } from "hono";
import { envs } from "../server-envs";

export function getUserIp(c: Context) {
    const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = c.req.header('x-real-ip');

    let ip = '';
    if (forwardedFor) {
      ip = forwardedFor;
    }
    if (realIp) {
      ip = realIp.trim();
    }
    if (envs.NODE_ENV === 'development') {
      ip = '0.0.0.0';
    }
  return ip;
}
