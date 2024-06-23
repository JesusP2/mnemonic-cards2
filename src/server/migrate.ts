import { migrate } from 'drizzle-orm/libsql/migrator';
import { client, db } from './db/pool';

await migrate(db, { migrationsFolder: './drizzle' }).catch((err) => {
  console.error(err);
  client.close();
});
client.close();
