import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import type { Env } from '../../types.js';
import * as schema from './schema/index.js';

export function buildTursoClient(envs: Env['Variables']) {
  const client = createClient({
    url: envs.DATABASE_URL,
    authToken: envs.DATABASE_TOKEN,
  });
  return drizzle(client, { schema });
}
