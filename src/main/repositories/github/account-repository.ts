import { db } from '@main/database'
import { GithubAccount, githubAccountTable, type NewGithubAccount } from '@main/database/schemas'
import { eq } from 'drizzle-orm'

export class AccountRepository {
  /**
   * 新規GitHubアカウントを登録する
   * @param data - GitHubアカウント情報
   * @returns 登録されたGitHubアカウント
   */
  async createAccount(data: NewGithubAccount): Promise<GithubAccount> {
    const results = await db.insert(githubAccountTable).values(data).returning()
    return results[0]
  }

  /**
   * 全てのGitHubアカウントを取得する
   * @returns GitHubアカウントのリスト
   */
  async findAll(): Promise<GithubAccount[]> {
    return db.select().from(githubAccountTable)
  }

  /**
   * IDでGitHubアカウントを検索する
   * @param id - アカウントID
   * @returns GitHubアカウント、存在しない場合はundefined
   */
  async findById(id: number): Promise<GithubAccount> {
    const results = await db.select().from(githubAccountTable).where(eq(githubAccountTable.id, id))
    return results[0]
  }

  /**
   * loginでGitHubアカウントを検索する
   * @param login - GitHubユーザー名
   * @returns GitHubアカウント、存在しない場合はundefined
   */
  async findByLogin(login: string): Promise<GithubAccount> {
    const results = await db
      .select()
      .from(githubAccountTable)
      .where(eq(githubAccountTable.login, login))
    return results[0]
  }

  /**
   * GitHubアカウント情報を更新する
   * @param id - アカウントID
   * @param data - 更新するデータ
   * @returns 更新されたGitHubアカウント
   */
  async update(id: number, data: Partial<NewGithubAccount>): Promise<GithubAccount> {
    const results = await db
      .update(githubAccountTable)
      .set(data)
      .where(eq(githubAccountTable.id, id))
      .returning()
    return results[0]
  }

  /**
   * GitHubアカウントを削除する
   * @param id - アカウントID
   */
  async delete(id: number): Promise<void> {
    await db.delete(githubAccountTable).where(eq(githubAccountTable.id, id))
  }
}

export const githubAccountRepository = new AccountRepository()
