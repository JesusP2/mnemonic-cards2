import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Session, User } from 'lucia';
import type { Result } from '../../lib/types';
import { lucia } from '../lucia';

export async function checkUserLogin(
  c: Context,
): Promise<Result<{ user: User; session: Session }, Error>> {
  const sessionId = getCookie(c, lucia.sessionCookieName);
  if (!sessionId) {
    return {
      success: false,
      error: new Error('User not logged in'),
    };
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (!user) {
    return {
      success: false,
      error: new Error('User not logged in'),
    };
  }
  return {
    success: true,
    data: {
      session: session as Session,
      user: user as User,
    },
  };
}
