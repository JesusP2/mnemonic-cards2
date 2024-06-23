import * as z from 'zod';
export const envs = z
  .object({
    NODE_ENV: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    DATABASE_TOKEN: z.string().min(1),
    CLOUDFLARE_TOKEN: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ENDPOINT: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
  })
  .parse(process.env);
