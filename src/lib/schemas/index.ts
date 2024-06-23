import { z } from "zod";

export const signinSchema = z.object({
  username: z.string().min(3, 'Username must be at least  3 character long.'),
  password: z.string().min(8,  'Password must be at least  8 characters long').max(255, 'password cannot be longer than  255 characters')
})

export const signupSchema = signinSchema.merge(z.object({
  email: z.string().email().nullish()
}))

export const emailVerificationSchema = z.object({
  email: z.string().email()
})
