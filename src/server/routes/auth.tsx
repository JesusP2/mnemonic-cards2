import { parseWithZod } from '@conform-to/zod';
import { Hono } from 'hono';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { z } from 'zod';
import {
  changePasswordSchema,
  codeSchema,
  profileSchema,
  signinSchema,
  signupSchema,
  validateResetTokenSchema,
} from '../../lib/schemas';
import { emailVerificationModel } from '../data-access/email-verification';
import { magicLinkModel, resetTokenModel } from '../data-access/reset-token';
import {
  createUserSession,
  deleteAllUserSessions,
  deleteUserSessions,
} from '../data-access/sessions';
import { userModel } from '../data-access/users';
import { db } from '../db/pool';
import { ResetPasswordEmail } from '../emails/reset-password';
import { VerifyEmail } from '../emails/verify-email';
import { createUlid, hashPassword, lucia } from '../lucia';
import { sendEmail } from '../utils/email';
import { generateTokenEndpoint } from '../utils/generate-token';
import { MagicLinkEmail } from '../emails/magic-link';
import { uploadFile } from '../utils/r2';

export const authRoute = new Hono();
authRoute.post('/signin', async (c) => {
  if (c.get('user')) {
    return c.json(null, 403);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signinSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  try {
    const user = await userModel.findByUsername(submission.value.username);
    const passwordHash = await hashPassword(submission.value.password);
    if (!user || user.password !== passwordHash) {
      return c.json(
        submission.reply({
          fieldErrors: {
            username: ['Invalid credentials'],
            password: ['Invalid credentials'],
          },
        }),
        400,
      );
    }
    await createUserSession(c, user.id);
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['Invalid credentials'],
          password: ['Invalid credentials'],
        },
      }),
      400,
    );
  }
});

authRoute.post('/signup', async (c) => {
  if (c.get('user')) {
    return c.json(null, 403);
  }
  const formData = await c.req.formData();
  const submission = parseWithZod(formData, { schema: signupSchema });
  if (submission.status !== 'success') {
    return c.json(submission.reply(), 400);
  }
  const passwordHash = await hashPassword(submission.value.password);
  const userId = createUlid();
  try {
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
    await userModel.create({
      id: userId,
      username: submission.value.username,
      password: passwordHash,
      email: null,
      avatar: null,
    });
    await createUserSession(c, userId);
    return c.json(null, 200);
  } catch (err) {
    return c.json(
      submission.reply({
        fieldErrors: {
          username: ['User already exists'],
        },
      }),
      400,
    );
  }
});

authRoute.put('/profile', async (c) => {
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
  console.log(submission.value);
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
      await uploadFile(Buffer.from(await submission.value.avatar.arrayBuffer()), avatarKey)
    }
    await db.transaction(async (tx) => {
      if (isUsernameBeingUpdated || submission.value.avatar instanceof File) {
        await userModel.update(
          user.id,
          {
            username: isUsernameBeingUpdated ? submission.value.username : undefined,
            avatar: avatarKey ? avatarKey : undefined,
          },
          tx,
        );
      }
      if (isEmailBeingUpdated) {
        // TODO: send URL to email
        const code = generateRandomString(6, alphabet('0-9'));
        await emailVerificationModel.deleteAllByUserId(user.id, tx);
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

authRoute.post('/email-verification', async (c) => {
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

authRoute.post('/signout', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.redirect('/auth/signin');
  }
  await deleteUserSessions(c, session.id);
  return c.redirect('/auth/signin');
});

authRoute.post('/signout-global', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.redirect('/auth/signin');
  }
  await deleteAllUserSessions(c, user.id);
  return c.redirect('/auth/signin');
});

authRoute.put('/password', async (c) => {
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

authRoute.post(
  '/reset-password/email',
  generateTokenEndpoint(ResetPasswordEmail, 'Reset password', resetTokenModel),
);

authRoute.post('/reset-password/token', async (c) => {
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

authRoute.post(
  '/magic-link/generate',
  generateTokenEndpoint(MagicLinkEmail, 'Magic link', magicLinkModel),
);

authRoute.get('/magic-link/:token', async (c) => {
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
