import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * サンプルテーブル
 * 実際のアプリケーションで使用するスキーマを定義する際は、
 * このファイルを参考に新しいスキーマファイルを作成してください
 */
export const exampleTable = sqliteTable('example', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
})

export type Example = typeof exampleTable.$inferSelect
export type NewExample = typeof exampleTable.$inferInsert
