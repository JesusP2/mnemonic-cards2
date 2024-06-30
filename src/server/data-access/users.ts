import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { db } from '../db/pool';
import { userTable } from '../db/schema';
import type * as schema from '../db/schema';
import type { DB } from '../types';

export class UserModel<T extends typeof schema> {
  constructor(private db: LibSQLDatabase<T>) {}

  async findById(id: string, db: DB<T> = this.db) {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);
    return user;
  }

  async findByUsername(username: string, db: DB<T> = this.db) {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);
    return user;
  }

  async findByEmail(email: string, db: DB<T> = this.db) {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    return user;
  }

  async create(
    data: {
      id: string;
      username: string;
      email: string | null;
      password: string | null;
    },
    db: DB<T> = this.db,
  ) {
    return db.insert(userTable).values(data).onConflictDoNothing();
  }

  async update(
    userId: string,
    {
      username,
      email,
      password,
    }: {
      username?: string;
      email?: string | null;
      password?: string;
    },
    db: DB<T> = this.db,
  ) {
    const data = {} as Record<string, unknown>;
    if (typeof username !== 'undefined') {
      data.username = username;
    }
    if (typeof email !== 'undefined') {
      data.email = email;
    }
    if (typeof password !== 'undefined') {
      data.password = password;
    }
    return db.update(userTable).set(data).where(eq(userTable.id, userId));
  }
}

export const userModel = new UserModel(db);
