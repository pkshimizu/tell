import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * GitHubアカウント情報テーブル
 * GitHub Personal Access Tokenとユーザー情報を保存する
 */
export const githubAccountTable = sqliteTable('github_account', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  login: text('login').notNull(),
  name: text('name'),
  htmlUrl: text('html_url').notNull(),
  avatarUrl: text('avatar_url'),
  personalAccessToken: text('personal_access_token').notNull(),
  expiredAt: integer('expired_at', { mode: 'timestamp' })
})

export type GithubAccount = typeof githubAccountTable.$inferSelect
export type NewGithubAccount = typeof githubAccountTable.$inferInsert
