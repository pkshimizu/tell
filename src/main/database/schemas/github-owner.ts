import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { githubAccountTable } from './github-account'

export const githubOwnerTable = sqliteTable('github_owner', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  githubAccountId: integer('github_account_id')
    .notNull()
    .references(() => githubAccountTable.id, { onDelete: 'cascade' }),
  login: text('login').notNull(),
  htmlUrl: text('html_url').notNull(),
  avatarUrl: text('avatar_url')
})

export type GithubOwner = typeof githubOwnerTable.$inferSelect
export type NewGithubOwner = typeof githubOwnerTable.$inferInsert
