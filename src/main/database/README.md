# Database

このディレクトリには、Drizzle ORMを使用したSQLiteデータベースの設定とスキーマが含まれています。

## ディレクトリ構造

```
src/main/database/
├── index.ts          # データベース接続設定
├── schemas/          # テーブルスキーマ定義
│   ├── index.ts      # スキーマのエクスポート
│   └── example.ts    # サンプルスキーマ
└── migrations/       # マイグレーションファイル
    └── 0000_xxx.sql  # 自動生成されたマイグレーション
```

## セットアップ

### 1. スキーマの定義

新しいテーブルを追加する場合は、`schemas/` ディレクトリに新しいファイルを作成します。

```typescript
// schemas/users.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
})

export type User = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert
```

作成したスキーマは `schemas/index.ts` でエクスポートしてください。

```typescript
// schemas/index.ts
export * from './example'
export * from './users' // 新しく追加
```

### 2. マイグレーションの生成

スキーマを変更したら、マイグレーションファイルを生成します。

```bash
npm run db:generate
```

### 3. マイグレーションの適用

生成されたマイグレーションをデータベースに適用します。

```bash
npm run db:push
```

または、本番環境向けにマイグレーションを実行する場合：

```bash
npm run db:migrate
```

## 使用方法

### データベースへのアクセス

```typescript
import { db } from '@main/database'
import { usersTable } from '@main/database/schemas'

// データの取得
const users = await db.select().from(usersTable)

// データの挿入
await db.insert(usersTable).values({
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Repositoryパターンの使用（推奨）

直接データベースにアクセスするのではなく、Repositoryクラスを作成することを推奨します。
詳細は `src/main/repositories/README.md` を参照してください。

## データベースファイルの保存場所

- **開発環境**: `./data/app.db`
- **本番環境**: ユーザーデータディレクトリ（`app.getPath('userData')`）

## 利用可能なコマンド

```bash
# マイグレーションファイルの生成
npm run db:generate

# マイグレーションの適用
npm run db:migrate

# スキーマをデータベースに直接プッシュ（開発用）
npm run db:push

# Drizzle Studio（GUIツール）を起動
npm run db:studio
```

## 注意事項

- データベースファイル（`*.db`）は `.gitignore` に含まれています
- 本番環境では `db:migrate` を使用してマイグレーションを適用してください
- 開発中は `db:push` でスキーマを直接適用できますが、マイグレーション履歴が残りません
