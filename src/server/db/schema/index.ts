import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  password: text('password').notNull(),
});

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer('expires_at').notNull(),
});

export const deckTable = sqliteTable('deck', {
  id: text('id').notNull().primaryKey(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const cardTable = sqliteTable('card', {
  id: text('id').notNull().primaryKey(),
  deckId: text('deck_id')
    .notNull()
    .references(() => deckTable.id, { onDelete: 'cascade' }),
  frontImageUrl: text('front_image_url'),
  frontImageKey: text('front_image_key'),
  frontText: text('front_text'),
  backImageUrl: text('back_image_url'),
  backImageKey: text('back_image_key'),
  backText: text('back_text'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const usersDeckTable = sqliteTable('user_deck', {
  id: text('id').notNull().primaryKey(),
  deckId: text('deck_id')
    .notNull()
    .references(() => deckTable.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const emailVerificationTable = sqliteTable('email_verification', {
  id: text('id').notNull().primaryKey(),
  code: text('code').notNull(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: text('expires_at'),
});
