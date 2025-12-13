import { db } from '@main/database'
import {
  GithubRepository,
  githubRepositoryTable,
  type NewGithubRepository
} from '@main/database/schemas'
import { eq, and } from 'drizzle-orm'

export class RepositoryRepository {
  /**
   * 新規GitHubリポジトリを登録する
   * @param data - GitHubリポジトリ情報
   * @returns 登録されたGitHubリポジトリ
   */
  async create(data: NewGithubRepository): Promise<GithubRepository> {
    const results = await db.insert(githubRepositoryTable).values(data).returning()
    return results[0]
  }

  /**
   * GitHubオーナーIDと名前でリポジトリを検索する
   * @param githubOwnerId - GitHubオーナーID
   * @param name - リポジトリ名
   * @returns GitHubリポジトリ、存在しない場合はundefined
   */
  async findByOwnerIdAndName(
    githubOwnerId: number,
    name: string
  ): Promise<GithubRepository | undefined> {
    const results = await db
      .select()
      .from(githubRepositoryTable)
      .where(
        and(
          eq(githubRepositoryTable.githubOwnerId, githubOwnerId),
          eq(githubRepositoryTable.name, name)
        )
      )
    return results[0]
  }

  /**
   * GitHubオーナーIDで登録済みリポジトリを取得する
   * @param githubOwnerId - GitHubオーナーID
   * @returns GitHubリポジトリのリスト
   */
  async findByOwnerId(githubOwnerId: number): Promise<GithubRepository[]> {
    return await db
      .select()
      .from(githubRepositoryTable)
      .where(eq(githubRepositoryTable.githubOwnerId, githubOwnerId))
  }

  /**
   * GitHubリポジトリを削除する
   * @param id - GitHubリポジトリID
   */
  async delete(id: number): Promise<void> {
    await db.delete(githubRepositoryTable).where(eq(githubRepositoryTable.id, id))
  }
}

export const githubRepositoryRepository = new RepositoryRepository()
