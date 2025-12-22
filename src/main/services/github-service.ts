import { githubApiRepository } from '@main/repositories/github/api-repository'
import { githubStoreRepository } from '@main/repositories/store/settings/github-repository'
import type {
  GitHubApiOwner,
  GitHubApiPullRequest,
  GitHubApiRepository,
  GitHubPullRequestState
} from '@main/models/github'

/**
 * GitHubアカウント管理サービス
 */
export class GitHubService {
  /**
   * GitHubアカウントIDからオーナー一覧を取得する
   * @param accountId - GitHubアカウントID (UUID)
   * @returns オーナー一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getOwners(accountId: string): Promise<GitHubApiOwner[]> {
    // storeからアカウント情報を取得
    const account = githubStoreRepository.findAccountById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // GitHub APIから組織一覧を取得
    const owners = await githubApiRepository.getOwners(account.personalAccessToken)
    const accountOwner: GitHubApiOwner = {
      login: account.login,
      htmlUrl: account.htmlUrl,
      avatarUrl: account.avatarUrl
    }
    return [accountOwner, ...owners]
  }

  /**
   * GitHubアカウントIDとオーナー名からリポジトリ一覧を取得する
   * @param accountId - GitHubアカウントID (UUID)
   * @param ownerLogin - オーナー名
   * @returns リポジトリ一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getRepositories(accountId: string, ownerLogin: string): Promise<GitHubApiRepository[]> {
    // storeからアカウント情報を取得
    const account = githubStoreRepository.findAccountById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // アカウント自身のリポジトリか、Organizationのリポジトリかを判定
    if (ownerLogin === account.login) {
      // アカウント自身のリポジトリを取得
      return await githubApiRepository.getUserRepositories(account.personalAccessToken)
    } else {
      // Organizationのリポジトリを取得
      return await githubApiRepository.getRepositories(account.personalAccessToken, ownerLogin)
    }
  }

  /**
   * 登録済みの全てのリポジトリからプルリクエストを取得する
   * @param state - プルリクエストの状態 ('open' | 'closed')
   * @returns プルリクエストのリスト
   * @throws Error - API呼び出しが失敗した場合
   */
  async getPullRequests(state: GitHubPullRequestState): Promise<GitHubApiPullRequest[]> {
    const allRepositories = githubStoreRepository.getAllRepositories()
    const pullRequests: GitHubApiPullRequest[] = []

    for (const { account, owner, repository } of allRepositories) {
      const prs = await githubApiRepository.getPullRequests(
        account.personalAccessToken,
        owner.login,
        repository.name,
        state
      )
      pullRequests.push(...prs)
    }

    return pullRequests
  }
}

export const githubService = new GitHubService()
