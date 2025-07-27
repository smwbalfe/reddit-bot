import { pgTable, serial, varchar, timestamp, boolean, text, integer, foreignKey } from 'drizzle-orm/pg-core'

export const accounts = pgTable('Account', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  welcomeEmailSent: boolean('welcomeEmailSent').default(false).notNull(),
})

export const icps = pgTable('ICP', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  name: varchar('name').notNull(),
  website: varchar('website').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const redditPosts = pgTable('RedditPost', {
  id: serial('id').primaryKey(),
  icpId: integer('icpId').notNull(),
  subreddit: varchar('subreddit').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category').notNull(),
  url: text('url').notNull(),
  leadQuality: integer('leadQuality'),
  justification: text('justification'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  icpReference: foreignKey({
    columns: [table.icpId],
    foreignColumns: [icps.id]
  })
}))

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type RedditPost = typeof redditPosts.$inferSelect
export type NewRedditPost = typeof redditPosts.$inferInsert
export type ICP = typeof icps.$inferSelect
export type NewICP = typeof icps.$inferInsert
