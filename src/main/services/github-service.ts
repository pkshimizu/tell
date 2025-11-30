import { githubApiRepository } from '@main/repositories/github/api-repository'
import { githubAccountRepository } from '@main/repositories/github/account-repository'
import type { GithubAccount } from '@main/database/schemas'

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
}

export const githubService = new GitHubService()
