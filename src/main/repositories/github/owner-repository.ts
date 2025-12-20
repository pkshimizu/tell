import { db } from '@main/database'
import { GithubOwner, githubOwnerTable, type NewGithubOwner } from '@main/database/schemas'
import { eq, and } from 'drizzle-orm'

export class OwnerRepository {
  /**
   * 新規GitHubオーナーを登録する
   * @param data - GitHubオーナー情報
   * @returns 登録されたGitHubオーナー
   */
  async create(data: NewGithubOwner): Promise<GithubOwner> {
    const results = await db.insert(githubOwnerTable).values(data).returning()
    return results[0]
  }

  /**
   * GitHubアカウントIDとloginでオーナーを検索する
   * @param githubAccountId - GitHubアカウントID
   * @param login - オーナーlogin
   * @returns GitHubオーナー、存在しない場合はundefined
   */
  async findByAccountIdAndLogin(
    githubAccountId: number,
    login: string
  ): Promise<GithubOwner | undefined> {
    const results = await db
      .select()
      .from(githubOwnerTable)
      .where(
        and(
          eq(githubOwnerTable.githubAccountId, githubAccountId),
          eq(githubOwnerTable.login, login)
        )
      )
    return results[0]
  }

  /**
   * IDでGitHubオーナーを検索する
   * @param id - オーナーID
   * @returns GitHubオーナー、存在しない場合はundefined
   */
  async findById(id: number): Promise<GithubOwner | undefined> {
    const results = await db.select().from(githubOwnerTable).where(eq(githubOwnerTable.id, id))
    return results[0]
  }

  /**
   * GitHubアカウントIDで全てのオーナーを取得する
   * @param accountId - GitHubアカウントID
   * @returns GitHubオーナーのリスト
   */
  async findAllByAccountId(accountId: number): Promise<GithubOwner[]> {
    return db.select().from(githubOwnerTable).where(eq(githubOwnerTable.githubAccountId, accountId))
  }
}

export const githubOwnerRepository = new OwnerRepository()
