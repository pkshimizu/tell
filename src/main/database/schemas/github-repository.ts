import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { githubOwnerTable } from './github-owner'

export const githubRepositoryTable = sqliteTable('github_repository', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  githubOwnerId: integer('github_owner_id')
    .notNull()
    .references(() => githubOwnerTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  htmlUrl: text('html_url').notNull()
})

export type GithubRepository = typeof githubRepositoryTable.$inferSelect
export type NewGithubRepository = typeof githubRepositoryTable.$inferInsert
