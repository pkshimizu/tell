import { githubApiRepository } from '@main/repositories/github/api-repository'
import { githubAccountRepository } from '@main/repositories/github/account-repository'
import type { GithubAccount } from '@main/database/schemas'
import type { GitHubApiOrganization, GitHubApiRepository } from '@main/models/github'

/**
 * GitHubアカウント管理サービス
 */
export class GitHubService {
  /**
   * GitHub Personal Access Tokenを使用してアカウント情報を取得し、DBに保存する
   * @param personalAccessToken - GitHub Personal Access Token
   * @returns 保存されたGitHubアカウント情報
   * @throws Error - アカウントが既に登録されている場合、またはAPI呼び出しが失敗した場合
   */
  async createAccount(personalAccessToken: string): Promise<GithubAccount> {
    // GitHub APIからアカウント情報を取得
    const accountInfo = await githubApiRepository.getAccount(personalAccessToken)

    // トークンの有効期限を取得
    const expiredAt = await githubApiRepository.getTokenExpiration(personalAccessToken)

    // 既に登録済みかチェック
    const existingAccount = await githubAccountRepository.findByLogin(accountInfo.login)
    if (existingAccount) {
      throw new Error(
        `GitHub account '${accountInfo.login}' is already registered. Please use a different account or update the existing one.`
      )
    }

    // DBに保存
    return await githubAccountRepository.createAccount({
      login: accountInfo.login,
      name: accountInfo.name,
      htmlUrl: accountInfo.htmlUrl,
      avatarUrl: accountInfo.avatarUrl,
      personalAccessToken,
      expiredAt
    })
  }

  /**
   * GitHubアカウントIDから組織一覧を取得する
   * @param accountId - GitHubアカウントID
   * @returns 組織一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getOrganizations(accountId: number): Promise<GitHubApiOrganization[]> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // GitHub APIから組織一覧を取得
    return await githubApiRepository.getOrganizations(account.personalAccessToken)
  }

  /**
   * GitHubアカウントIDと組織名からリポジトリ一覧を取得する
   * @param accountId - GitHubアカウントID
   * @param organizationLogin - 組織名
   * @returns リポジトリ一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getRepositories(
    accountId: number,
    organizationLogin: string
  ): Promise<GitHubApiRepository[]> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // GitHub APIからリポジトリ一覧を取得
    return await githubApiRepository.getRepositories(account.personalAccessToken, organizationLogin)
  }
}

export const githubService = new GitHubService()
