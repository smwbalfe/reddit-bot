import { pgTable, serial, varchar, timestamp, boolean, text, integer, foreignKey, jsonb } from 'drizzle-orm/pg-core'

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
  data: jsonb('data').$type<{
    keywords?: string[],
    subreddits?: string[],
    painPoints?: string,
    description?: string,
  }>().notNull().default({}),
  monitoringEnabled: boolean('monitoringEnabled').default(true).notNull(),
  leadLimit: integer('leadLimit').default(100).notNull(),
  seeded: boolean('seeded').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const redditPosts = pgTable('RedditPost', {
  id: serial('id').primaryKey(),
  icpId: integer('icpId').notNull(),
  submissionId: varchar('submissionId').notNull().unique(),
  subreddit: varchar('subreddit').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  url: text('url').notNull(),
  leadQuality: integer('leadQuality'),
  analysisData: jsonb('analysisData').$type<{
    painPoints?: string;
    productFitScore?: number;
    intentSignalsScore?: number;
    urgencyIndicatorsScore?: number;
    decisionAuthorityScore?: number;
    engagementQualityScore?: number;
    productFitJustification?: string;
    intentSignalsJustification?: string;
    urgencyIndicatorsJustification?: string;
    decisionAuthorityJustification?: string;
    engagementQualityJustification?: string;
  }>(),
  redditCreatedAt: timestamp('redditCreatedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  icpReference: foreignKey({
    columns: [table.icpId],
    foreignColumns: [icps.id]
  })
}))

export const systemFlags = pgTable('SystemFlag', {
  id: serial('id').primaryKey(),
  key: varchar('key').notNull().unique(),
  value: boolean('value').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const usageTracking = pgTable('UsageTracking', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  repliesGenerated: integer('repliesGenerated').default(0).notNull(),
  qualifiedLeads: integer('qualifiedLeads').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  userMonthYear: {
    columns: [table.userId, table.month, table.year],
    unique: true,
  },
}))

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type RedditPost = typeof redditPosts.$inferSelect
export type NewRedditPost = typeof redditPosts.$inferInsert
export type ICP = typeof icps.$inferSelect
export type NewICP = typeof icps.$inferInsert
export type SystemFlag = typeof systemFlags.$inferSelect
export type NewSystemFlag = typeof systemFlags.$inferInsert
export type UsageTracking = typeof usageTracking.$inferSelect
export type NewUsageTracking = typeof usageTracking.$inferInsert
