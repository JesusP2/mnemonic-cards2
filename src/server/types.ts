import type { ResultSet } from '@libsql/client';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import type * as schema from './db/schema';

export type DB<T extends typeof schema> =
  | LibSQLDatabase<T>
  | SQLiteTransaction<'async', ResultSet, T, ExtractTablesWithRelations<T>>;
