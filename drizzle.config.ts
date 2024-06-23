import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'turso',
  schema: './src/lib/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
    authToken: process.env.DATABASE_TOKEN as string,
  },
});
