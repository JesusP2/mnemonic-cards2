import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { GitHub, Google } from 'arctic';
import { Lucia } from 'lucia';
import { db } from './db/pool';
import { sessionTable, userTable } from './db/schema';
import { envs } from './server-envs';

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: envs.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
      avatar: attributes.avatar,
      isOauth: attributes.password === null,
    };
  },
});

export const github = new GitHub(
  envs.GITHUB_CLIENT_ID,
  envs.GITHUB_CLIENT_SECRET,
);
export const google = new Google(
  envs.GOOGLE_CLIENT_ID,
  envs.GOOGLE_CLIENT_SECRET,
  envs.GOOGLE_REDIRECT_URI,
);

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
  const passworddHash = await hashPassword(password2);
  return passworddHash === password1;
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      email: string | null;
      avatar: string | null;
      password: string | null;
    };
  }
}
