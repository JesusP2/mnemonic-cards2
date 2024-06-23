import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { ulidFactory } from 'ulid-workers';
import { db } from './db/pool';
import { sessionTable, userTable } from './db/schema';
import { envs } from './server-envs';

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: envs.NODE_ENV === 'production',
      sameSite: 'lax'
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
    };
  },
});

export async function hashPassword(password: string) {
  const textEncoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    {
      name: 'SHA-256',
    },
    textEncoder.encode(password),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export async function comparePasswords(password1: string, password2: string) {
  const hashedPassword = await hashPassword(password2);
  return hashedPassword === password1;
}

export function createUlid() {
  const ulid = ulidFactory();
  return ulid();
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      email?: string | null;
    };
  }
}
