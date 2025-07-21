import { pgTable, serial, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core'

export const accounts = pgTable('Account', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  welcomeEmailSent: boolean('welcomeEmailSent').default(false).notNull(),
})

export const redditPosts = pgTable('RedditPost', {
  id: serial('id').primaryKey(),
  subreddit: varchar('subreddit').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category').notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const configs = pgTable('Config', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  subreddit: varchar('subreddit').notNull(),
  agentPrompt: text('agentPrompt').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type RedditPost = typeof redditPosts.$inferSelect
export type NewRedditPost = typeof redditPosts.$inferInsert

export type Config = typeof configs.$inferSelect
export type NewConfig = typeof configs.$inferInsert