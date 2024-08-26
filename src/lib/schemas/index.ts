import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least  8 characters long')
  .max(255, 'password cannot be longer than  255 characters');
export const signinSchema = z.object({
  username: z.string().min(3, 'Username must be at least  3 character long.'),
  password: passwordSchema,
});

export const signupSchema = signinSchema;
export const emailVerificationSchema = z.object({
  email: z.string().email().max(255),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least  3 character long.')
    .max(255),
  email: z.string().email().max(255).nullish(),
  avatar: z
    .instanceof(File)
    .refine(
      (data) => data.size < 1 * 1024 * 1024,
      'Exceeded file size limit (1MB).',
    )
    .nullish(),
});

export const codeSchema = z.object({
  code: z.string().length(6),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const resetTokenSchema = z.object({
  email: z.string().email().max(255),
});

export const validateResetTokenSchema = z.object({
  password: passwordSchema,
  token: z.string().max(255),
});

export const magicLinkTokenSchema = z.object({
  token: z.string().max(255),
});

export const fileSchema = z.object({
  file: z.instanceof(File),
  url: z.string(),
});

export const createCardSchema = z.object({
  markdown: z.string(),
  files: z.array(fileSchema),
});

export const updateCardSchema = z.object({
  due: z.coerce.number(),
  rating: z.coerce.number(),
  state: z.coerce.number(),
  reps: z.coerce.number(),
  lapses: z.coerce.number(),
  stability: z.coerce.number(),
  difficulty: z.coerce.number(),
  last_review: z.coerce.number().optional(),
  elapsed_days: z.coerce.number(),
  scheduled_days: z.coerce.number(),
});

export const createDeckSchema = z.object({
  id: z.string().ulid(),
  name: z.string(),
  description: z.string().optional(),
});

export const updateDeckSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
