import { parseWithZod } from '@conform-to/zod';
import { Hono } from 'hono';
import { isWithinExpirationDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { validateResetTokenSchema } from '../../lib/schemas';
import { resetTokenModel } from '../data-access/reset-token';
import { createUserSession } from '../data-access/sessions';
import { userModel } from '../data-access/users';
import { ResetPasswordEmail } from '../emails/reset-password';
import { hashPassword, lucia } from '../lucia';
import { generateTokenEndpoint } from '../utils/generate-token';
import { emailRateLimiter, rateLimitMiddleware } from '../utils/rate-limiter';

export const resetPasswordRoute = new Hono();
resetPasswordRoute.use(rateLimitMiddleware(emailRateLimiter));
resetPasswordRoute.post(
  '/reset-password/email',
  generateTokenEndpoint(ResetPasswordEmail, 'Reset password', resetTokenModel),
);

resetPasswordRoute.post('/reset-password/token', async (c) => {
  const loggedInUser = c.get('user');
  if (loggedInUser) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: validateResetTokenSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  const tokenHash = encodeHex(
    await sha256(new TextEncoder().encode(submission.value.token)),
  );
  const record = await resetTokenModel.findByToken(tokenHash);
  if (!record || !isWithinExpirationDate(new Date(record.expiresAt))) {
    return c.json(
      submission.reply({
        fieldErrors: {
          password: ['Token expired'],
        },
      }),
      400,
    );
  }
  await lucia.invalidateUserSessions(record.userId);
  const passwordHash = await hashPassword(submission.value.password);
  await userModel.update(record.userId, { password: passwordHash });
  await createUserSession(c, record.userId);
  return c.json(null, 200);
});
