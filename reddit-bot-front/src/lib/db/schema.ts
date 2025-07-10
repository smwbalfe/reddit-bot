import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'

export const accounts = pgTable('Account', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  welcomeEmailSent: boolean('welcomeEmailSent').default(false).notNull(),
})

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert 