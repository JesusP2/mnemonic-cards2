import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import type * as schema from '../db/schema';
import { resetTokenTable } from '../db/schema';
import type { DB } from '../types';

export class ResetTokenModel<T extends typeof schema> {
  constructor(private db: DB<T>) {}

  async findByToken(token: string, db: DB<T> = this.db) {
  const [record] = await db
    .select()
    .from(resetTokenTable)
    .where(eq(resetTokenTable.token, token));
  return record
  }

  async deleteByUserId(userId: string, db: DB<T> = this.db) {
    return db.delete(resetTokenTable).where(eq(resetTokenTable.userId, userId));
  }

  async create(data: { id: string; token: string; userId: string; expiresAt: string; }, db: DB<T> = this.db) {
    return db.insert(resetTokenTable).values(data);
  }
}

export const resetTokenModel = new ResetTokenModel(db)
