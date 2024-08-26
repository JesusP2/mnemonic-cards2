import { parseWithZod } from '@conform-to/zod';
import { Hono } from 'hono';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { z } from 'zod';
import {
  changePasswordSchema,
  codeSchema,
  profileSchema,
} from '../../lib/schemas';
import { emailVerificationModel } from '../data-access/email-verification';
import { deleteUserSessions } from '../data-access/sessions';
import { userModel } from '../data-access/users';
import { db } from '../db/pool';
import { VerifyEmail } from '../emails/verify-email';
import { hashPassword } from '../lucia';
import { sendEmail } from '../utils/email';
import { uploadFile } from '../utils/r2';
import { emailRateLimiter, rateLimitFn } from '../utils/rate-limiter';
import { createUlid } from '../utils/ulid';

export const accountRoute = new Hono();
accountRoute.put('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json(null, 401);
  }
  const schema = profileSchema.superRefine((data, ctx) => {
    if (user.email && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Required field',
      });
    }
  });
  const submission = parseWithZod(await c.req.formData(), { schema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  submission.value.email =
    submission.value.email === '' ? null : submission.value.email;
  if (user.isOauth) {
    submission.value.email = null;
  }
  const isUsernameBeingUpdated = submission.value.username !== user.username;
  const isEmailBeingUpdated =
    typeof submission.value.email === 'string' &&
    submission.value.email !== user.email;
  try {
    if (isUsernameBeingUpdated) {
      const user = await userModel.findByUsername(submission.value.username);
      if (user) {
        return c.json(
          submission.reply({
            fieldErrors: {
              username: ['User already exists'],
            },
          }),
          400,
        );
      }
    }
    if (isEmailBeingUpdated) {
      const user = await userModel.findByEmail(
        submission.value.email as string,
      );
      if (user) {
        return c.json(
          submission.reply({
            fieldErrors: {
              email: ['Email is already being used'],
            },
          }),
          400,
        );
      }
    }
    let avatarKey = null;
    if (submission.value.avatar instanceof File) {
      const extension = submission.value.avatar.type.split('/')[1];
      avatarKey = `${createUlid()}.${extension}`;
      await uploadFile(
        Buffer.from(await submission.value.avatar.arrayBuffer()),
        avatarKey,
      );
    }
    await db.transaction(async (tx) => {
      if (isUsernameBeingUpdated || submission.value.avatar instanceof File) {
        await userModel.update(
          user.id,
          {
            username: isUsernameBeingUpdated
              ? submission.value.username
              : undefined,
            avatar: avatarKey ? avatarKey : undefined,
          },
          tx,
        );
      }
      if (isEmailBeingUpdated) {
        const code = generateRandomString(6, alphabet('0-9'));
        await emailVerificationModel.deleteAllByUserId(user.id, tx);
        const { success } = await rateLimitFn(c, emailRateLimiter);
        if (!success) {
          return c.json({ message: 'Too many requests' }, 400);
        }
        await sendEmail(
          submission.value.email as string,
          'Verify email',
          <VerifyEmail code={code} />,
        );
        await emailVerificationModel.create(
          {
            id: createUlid(),
            code: code,
            userId: user.id,
            email: submission.value.email as string,
            expiresAt: createDate(new TimeSpan(15, 'm')).toISOString(),
          },
          tx,
        );
      }
    });
  } catch (err) {
    console.error(err);
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['Failed to update field, please try again'],
          email: ['Failed to update field, please try again'],
        },
      }),
      400,
    );
  }
  if (isEmailBeingUpdated) {
    return c.json({ message: 'email verification sent' }, 200);
  }
  return c.json(null, 200);
});

accountRoute.post('/email-verification', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json(null, 401);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, {
    schema: codeSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply());
  }

  const emailVerification = await emailVerificationModel.findByUserIdAndCode({
    code: submission.value.code,
    userId: user.id,
  });
  if (
    !emailVerification ||
    !isWithinExpirationDate(new Date(emailVerification.expiresAt))
  ) {
    return c.json(
      submission.reply({
        fieldErrors: {
          code: ['Invalid code'],
        },
      }),
      403,
    );
  }

  try {
    await db.transaction(async (tx) => {
      await emailVerificationModel.deleteAllByUserId(user.id, tx);
      await userModel.update(user.id, { email: emailVerification.email }, tx);
    });
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      {
        message:
          'Could not validate email, this email is probably already being used',
      },
      400,
    );
  }
});

accountRoute.put('/password', async (c) => {
  const loggedInUser = c.get('user');
  if (!loggedInUser) {
    return c.json(null, 403);
  }
  const submission = parseWithZod(await c.req.formData(), {
    schema: changePasswordSchema,
  });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const user = await userModel.findByUsername(loggedInUser.id);
    const passwordHash = await hashPassword(submission.value.currentPassword);
    if (!user || user.password !== passwordHash) {
      return c.json(
        submission.reply({
          fieldErrors: {
            currentPassword: ['Invalid password'],
          },
        }),
        400,
      );
    }
    await userModel.update(loggedInUser.id, {
      password: await hashPassword(submission.value.newPassword),
    });
    await deleteUserSessions(c, loggedInUser.id);
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          currentPassword: ['Invalid password'],
        },
      }),
      400,
    );
  }
});
