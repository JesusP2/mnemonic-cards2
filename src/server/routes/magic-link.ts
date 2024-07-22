import { Hono } from 'hono';
import { isWithinExpirationDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { magicLinkModel } from '../data-access/reset-token';
import { createUserSession } from '../data-access/sessions';
import { MagicLinkEmail } from '../emails/magic-link';
import { lucia } from '../lucia';
import { generateTokenEndpoint } from '../utils/generate-token';

export const magicLinkRoute = new Hono();

magicLinkRoute.get('/:token', async (c) => {
  const loggedInUser = c.get('user');
  if (loggedInUser) {
    return c.redirect('/home');
  }
  const token = c.req.param('token');
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)));
  const record = await magicLinkModel.findByToken(tokenHash);
  if (!record || !isWithinExpirationDate(new Date(record.expiresAt))) {
    return c.redirect('/auth/signin');
  }
  await lucia.invalidateUserSessions(record.userId);
  await createUserSession(c, record.userId);
  return c.redirect('/home');
});

magicLinkRoute.post(
  '/generate',
  generateTokenEndpoint(MagicLinkEmail, 'Magic link', magicLinkModel),
);
