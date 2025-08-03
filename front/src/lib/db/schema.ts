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
  keywords: text('keywords').array().notNull().default([]),
  subreddits: text('subreddits').array().notNull().default([]),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const redditPosts = pgTable('RedditPost', {
  id: serial('id').primaryKey(), // ID of the lead
  icpId: integer('icpId').notNull(), // ID of the product the lead is for
  submissionId: varchar('submissionId').notNull(), // ID of the reddit submission
  subreddit: varchar('subreddit').notNull(), // name of the subreddit the lead is from
  title: text('title').notNull(), // title of the reddit submission
  content: text('content').notNull(), // content of the reddit submission
  url: text('url').notNull(), // url to the reddit submission
  leadQuality: integer('leadQuality'), // final quality score of the lead
  painPoints: text('painPoints'),
  productFitScore: integer('productFitScore'),
  intentSignalsScore: integer('intentSignalsScore'),
  urgencyIndicatorsScore: integer('urgencyIndicatorsScore'),
  decisionAuthorityScore: integer('decisionAuthorityScore'),
  engagementQualityScore: integer('engagementQualityScore'),
  productFitJustification: text('productFitJustification'),
  intentSignalsJustification: text('intentSignalsJustification'),
  urgencyIndicatorsJustification: text('urgencyIndicatorsJustification'),
  decisionAuthorityJustification: text('decisionAuthorityJustification'),
  engagementQualityJustification: text('engagementQualityJustification'),
  redditCreatedAt: timestamp('redditCreatedAt'), // when the Reddit post was originally created
  redditEditedAt: timestamp('redditEditedAt'), // when the Reddit post was last edited (if applicable)
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
