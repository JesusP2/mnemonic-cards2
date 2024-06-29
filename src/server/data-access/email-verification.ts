import { and, eq } from 'drizzle-orm';
import { db } from '../db/pool';
import type * as schema from '../db/schema';
import { emailVerificationTable } from '../db/schema';
import type { DB } from '../types';

export class EmailVerificationModel<T extends typeof schema> {
  constructor(private db: DB<T>) {}

  async findByUserIdAndCode(
    { code, userId }: { code: string; userId: string },
    db: DB<T> = this.db,
  ) {
    const [emailVerification] = await db
      .select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.code, code),
          eq(emailVerificationTable.userId, userId),
        ),
      );
    return emailVerification;
  }

  async deleteAllByUserId(userId: string, db: DB<T> = this.db) {
    return db
      .delete(emailVerificationTable)
      .where(eq(emailVerificationTable.userId, userId));
  }

  async create(
    data: {
      id: string;
      code: string;
      userId: string;
      email: string;
      expiresAt: string;
    },
    db: DB<T> = this.db,
  ) {
    return db.insert(emailVerificationTable).values(data);
  }
}

export const emailVerificationModel = new EmailVerificationModel(db);
