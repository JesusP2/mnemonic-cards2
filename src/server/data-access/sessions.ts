import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { lucia } from '../lucia';

export async function deleteUserSessions(c: Context, sessionId: string) {
  await lucia.invalidateSession(sessionId);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(c, blankSession.name, blankSession.value, blankSession.attributes);
}

export async function deleteAllUserSessions(c: Context, userId: string) {
  await lucia.invalidateUserSessions(userId);
  const blankSession = lucia.createBlankSessionCookie();
  setCookie(c, blankSession.name, blankSession.value, blankSession.attributes);
}

export async function createUserSession(c: Context, userId: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookie(
    c,
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}
