```js
/**
 * ─── LinkBox Database Schema (Drizzle ORM) ───
 * Three tables: users → links → clicks
 * Relations: users 1:N links, links 1:N clicks
 */

const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { relations } = require('drizzle-orm');

// ─── Users Table ───
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  username: text('username').unique().notNull(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').default('free'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

// ─── Links Table ───
const links = sqliteTable('links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  originalUrl: text('original_url').notNull(),
  shortCode: text('short_code').unique().notNull(),
  title: text('title'),
  icon: text('icon'),
  position: integer('position').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  clickCount: integer('click_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

// ─── Clicks Table ───
const clicks = sqliteTable('clicks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  linkId: integer('link_id')
    .notNull()
    .references(() => links.id, { onDelete: 'cascade' }),
  ipHash: text('ip_hash'),
  country: text('country'),
  device: text('device'),
  referrer: text('referrer'),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

// ─── Relations ───
const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
}));

const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  clicks: many(clicks),
}));

const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, {
    fields: [clicks.linkId],
    references: [links.id],
  }),
}));

module.exports = {
  users,
  links,
  clicks,
  usersRelations,
  linksRelations,
  clicksRelations,
};
```