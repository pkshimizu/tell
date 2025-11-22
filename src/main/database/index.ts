import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
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
