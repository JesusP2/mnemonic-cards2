import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import type * as schema from '../db/schema';
import { resetTokenTable, magicLinkTable } from '../db/schema';
import type { DB } from '../types';

export class ResetTokenModel<T extends typeof schema> {
  constructor(private db: DB<T>, private table: typeof resetTokenTable | typeof magicLinkTable) {}

  async findByToken(token: string, db: DB<T> = this.db) {
    const [record] = await db
      .select()
      .from(this.table)
      .where(eq(this.table.token, token));
    return record;
  }

  async deleteByUserId(userId: string, db: DB<T> = this.db) {
    return db.delete(this.table).where(eq(this.table.userId, userId));
  }

  async create(
    data: { id: string; token: string; userId: string; expiresAt: string },
    db: DB<T> = this.db,
  ) {
    return db.insert(this.table).values(data);
  }
}

export const resetTokenModel = new ResetTokenModel(db, resetTokenTable);
export const magicLinkModel = new ResetTokenModel(db, magicLinkTable);
