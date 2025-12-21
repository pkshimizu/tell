import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * データベースファイルのパスを取得
 * 開発環境: プロジェクトルートの data/app.db
 * 本番環境: ユーザーデータディレクトリの app.db
 */
function getDatabasePath(): string {
  if (process.env.NODE_ENV === 'development') {
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    return path.join(dbDir, 'app.db')
  }

  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'tell.db')
}

/**
 * SQLite データベース接続
 */
const sqlite = new Database(getDatabasePath())

/**
 * Drizzle ORM インスタンス
 */
export const db = drizzle(sqlite)

/**
 * データベース接続を閉じる
 */
export function closeDatabase(): void {
  sqlite.close()
}

/**
 * データベースマイグレーションを実行
 * アプリケーション起動時に呼び出される
 */
export function runMigrations(): void {
  try {
    console.log('Starting database migrations...')

    // 開発環境と本番環境でマイグレーションフォルダのパスを使い分ける
    let migrationsFolder: string
    if (process.env.NODE_ENV === 'development') {
      // 開発環境: プロジェクトルートからの相対パス
      migrationsFolder = path.join(process.cwd(), 'src/main/database/migrations')
    } else {
      // 本番環境: コンパイル後のディレクトリからの相対パス
      migrationsFolder = path.join(app.getAppPath(), 'out/main/database/migrations')
    }

    console.log(`Migration folder: ${migrationsFolder}`)
    migrate(db, { migrationsFolder })
    console.log('Database migrations completed successfully')
  } catch (error) {
    console.error('Database migration failed:', error)
    throw error
  }
}
