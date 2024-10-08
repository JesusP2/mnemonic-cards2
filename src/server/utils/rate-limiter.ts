import { and, count, eq, gt } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Context, Next } from 'hono';
import { db } from '../db/pool';
import type * as schema from '../db/schema';
import { rateLimitTable } from '../db/schema';
import { createUlid } from '../utils/ulid';
import { getUserIp } from './get-user-ip';

type Sum<A extends number, B extends number> = [
  ...ArrayOfLen<A>,
  ...ArrayOfLen<B>,
]['length'];
type NumberLine<
  A extends number,
  $acc extends unknown[] = [],
> = A extends $acc['length']
  ? $acc[number]
  : NumberLine<A, [...$acc, Sum<$acc['length'], 1>]>;
type ArrayOfLen<A, $acc extends unknown[] = []> = A extends $acc['length']
  ? $acc
  : ArrayOfLen<A, [...$acc, unknown]>;
type Unit = 's' | 'm' | 'h';
// NOTE: Could've done `${number}${Unit}` but I wanted to write some types
type Time = `${NumberLine<60>}${Unit}`;

export class RateLimit {
  private db: LibSQLDatabase<typeof schema>;
  private interval: number;
  private limiter: number;
  private prefix: string;
  constructor({
    db,
    interval,
    limiter,
    prefix,
  }: {
    db: LibSQLDatabase<typeof schema>;
    interval: Time;
    limiter: number;
    prefix: string;
  }) {
    this.db = db;
    this.interval = this.parseTime(interval);
    this.limiter = limiter;
    this.prefix = prefix;
  }

  private parseTime(interval: Time) {
    let multiplier = 1;
    if (interval.endsWith('s')) {
      multiplier = 1000;
    } else if (interval.endsWith('m')) {
      multiplier = 1000 * 60;
    } else {
      multiplier = 1000 * 60 * 60;
    }
    const time = Number(interval.slice(0, -1));
    return time * multiplier;
  }

  private prefixKey(key: string) {
    return `${this.prefix}${key}`;
  }

  public async limit(key: string) {
    const threshold = new Date().getTime() - this.interval;
    const [data] = await this.db
      .select({ count: count() })
      .from(rateLimitTable)
      .where(
        and(
          eq(rateLimitTable.key, this.prefixKey(key)),
          gt(rateLimitTable.createdAt, threshold),
        ),
      );
    const hits = data?.count;
    if (hits && hits > this.limiter) {
      return {
        success: false,
      };
    }
    await this.db.insert(rateLimitTable).values({
      id: createUlid(),
      key: this.prefixKey(key),
      createdAt: new Date().getTime(),
    });
    return {
      success: true,
    };
  }
}

export const defaultRateLimiter = new RateLimit({
  db: db,
  interval: '10s',
  limiter: 10,
  prefix: 'default_',
});

export const authRateLimiter = new RateLimit({
  db: db,
  interval: '1h',
  limiter: 10,
  prefix: 'auth_',
});

export const emailRateLimiter = new RateLimit({
  db: db,
  interval: '1h',
  limiter: 10,
  prefix: 'emails_',
});

export function rateLimitMiddleware(rateLimiter = defaultRateLimiter) {
  return async (c: Context, next: Next) => {
    const { success } = await rateLimitFn(c, rateLimiter);
    if (!success) {
      return c.json({ message: 'Too many requests' }, 400);
    }
    return next();
  };
}

export async function rateLimitFn(c: Context, rateLimiter: RateLimit) {
  const ip = getUserIp(c);
  if (!ip) {
    return {
      success: false,
    };
  }
  const { success } = await rateLimiter.limit(ip);
  if (!success) {
    return {
      success: false,
    };
  }
  return {
    success: true,
  };
}
