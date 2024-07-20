import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  username: text('username').notNull().unique(),
  avatar: text('avatar'),
  email: text('email').unique(),
  password: text('password'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const oauthAccountTable = sqliteTable('oauth_account', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull(),
  providerId: text('provider_id').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
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
  frontImageKey: text('front_image_key'),
  frontText: text('front_text'),
  backImageKey: text('back_image_key'),
  backText: text('back_text'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const usersDeckTable = sqliteTable('user_deck', {
  id: text('id').notNull().primaryKey(),
  deckId: text('deck_id')
    .notNull()
    .references(() => deckTable.id, { onDelete: 'no action' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  private: integer('private'),
  name: text('name').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const emailVerificationTable = sqliteTable('email_verification', {
  id: text('id').notNull().primaryKey(),
  code: text('code').notNull(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const resetTokenTable = sqliteTable('reset_token', {
  id: text('id').notNull().primaryKey(),
  token: text('token').notNull(),
  userId: text('user_id').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
});

export const magicLinkTable = sqliteTable('magic_link', {
  id: text('id').notNull().primaryKey(),
  token: text('token').notNull(),
  userId: text('user_id').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
});

export const rateLimitTable = sqliteTable(
  'rate_limit',
  {
    id: text('id').notNull().primaryKey(),
    key: text('key').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    KeyCreatedAtIdx: index('rate_limit__key__created_at__idx').on(
      table.key,
      table.createdAt,
    ),
  }),
);
