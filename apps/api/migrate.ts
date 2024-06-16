import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './src/lib/db/schema';

const client = createClient({
  url: process.env.DATABASE_URL as string,
  authToken: process.env.DATABASE_TOKEN,
});
const db = drizzle(client, { schema });

await migrate(db, { migrationsFolder: './drizzle' }).catch((err) => {
  console.error(err);
  client.close();
});
client.close();
