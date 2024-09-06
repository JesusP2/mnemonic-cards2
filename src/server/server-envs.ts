import * as z from 'zod';
console.log('process:', process.env.NODE_ENV)
console.log('process:', process.env.GOOGLE_CLIENT_ID)
export const envs = z
  .object({
    NODE_ENV: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_REDIRECT_URI: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    DATABASE_TOKEN: z.string().min(1),
    CLOUDFLARE_TOKEN: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ENDPOINT: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
  })
  .parse(process.env);
