import { githubApiRepository } from '@main/repositories/github/api-repository'
import { githubStoreRepository } from '@main/repositories/store/settings/github-repository'
import type {
  StoreSettingsGitHubAccount,
  StoreSettingsGitHubRepository
} from '@main/models/store/settings/github'

/**
 * 設定管理サービス
 */
export class SettingsService {
  /**
   * GitHub Personal Access Tokenを使用してアカウント情報を取得し、storeに保存する
   * @param personalAccessToken - GitHub Personal Access Token
   * @returns 保存されたGitHubアカウント情報
   * @throws Error - アカウントが既に登録されている場合、またはAPI呼び出しが失敗した場合
   */
  async createAccount(personalAccessToken: string): Promise<StoreSettingsGitHubAccount> {
    // GitHub APIからアカウント情報を取得
    const accountInfo = await githubApiRepository.getAccount(personalAccessToken)

    // トークンの有効期限を取得
    const expiredAt = await githubApiRepository.getTokenExpiration(personalAccessToken)

    // 既に登録済みかチェック
    const existingAccount = githubStoreRepository.findAccountByLogin(accountInfo.login)
    if (existingAccount) {
      throw new Error(
        `GitHub account '${accountInfo.login}' is already registered. Please use a different account or update the existing one.`
      )
    }

    // storeに保存
    return githubStoreRepository.createAccount({
      login: accountInfo.login,
      name: accountInfo.name,
      htmlUrl: accountInfo.htmlUrl,
      avatarUrl: accountInfo.avatarUrl,
      personalAccessToken,
      expiredAt: expiredAt ? expiredAt.toISOString() : null
    })
  }

  /**
   * リポジトリを選択してstoreに保存する
   * @param accountId - GitHubアカウントID (UUID)
   * @param ownerLogin - オーナー名
   * @param ownerHtmlUrl - オーナーのHTML URL
   * @param ownerAvatarUrl - オーナーのアバターURL
   * @param repositoryName - リポジトリ名
   * @param repositoryHtmlUrl - リポジトリのHTML URL
   * @returns 保存されたGitHubリポジトリ
   * @throws Error - アカウントが見つからない場合、またはstore操作が失敗した場合
   */
  async addRepository(
    accountId: string,
    ownerLogin: string,
    ownerHtmlUrl: string,
    ownerAvatarUrl: string | null,
    repositoryName: string,
    repositoryHtmlUrl: string
  ): Promise<StoreSettingsGitHubRepository> {
    // storeからアカウント情報を取得
    const account = githubStoreRepository.findAccountById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // オーナーが既に存在するかチェック
    let owner = githubStoreRepository.findOwnerByAccountIdAndLogin(accountId, ownerLogin)
    if (!owner) {
      // オーナーが存在しない場合は新規作成
      owner = githubStoreRepository.upsertOwner(accountId, {
        login: ownerLogin,
        htmlUrl: ownerHtmlUrl,
        avatarUrl: ownerAvatarUrl,
        repositories: []
      })
    }

    // リポジトリを追加
    return githubStoreRepository.addRepository(accountId, ownerLogin, {
      name: repositoryName,
      htmlUrl: repositoryHtmlUrl
    })
  }

  /**
   * GitHubアカウントIDとオーナー名から選択済みリポジトリを取得する
   * @param accountId - GitHubアカウントID (UUID)
   * @param ownerLogin - オーナー名
   * @returns 選択済みリポジトリのリスト
   * @throws Error - アカウントが見つからない場合
   */
  async getRegisteredRepositories(
    accountId: string,
    ownerLogin: string
  ): Promise<StoreSettingsGitHubRepository[]> {
    // storeからアカウント情報を取得
    const account = githubStoreRepository.findAccountById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // オーナーに紐づくリポジトリを取得
    return githubStoreRepository.findRepositoriesByOwner(accountId, ownerLogin)
  }

  /**
   * リポジトリの選択を解除（storeから削除）する
   * @param accountId - GitHubアカウントID (UUID)
   * @param ownerLogin - オーナー名
   * @param repositoryName - リポジトリ名
   * @throws Error - アカウントが見つからない場合、またはstore操作が失敗した場合
   */
  async removeRepository(
    accountId: string,
    ownerLogin: string,
    repositoryName: string
  ): Promise<void> {
    // storeからアカウント情報を取得
    const account = githubStoreRepository.findAccountById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // リポジトリを削除
    githubStoreRepository.deleteRepository(accountId, ownerLogin, repositoryName)
  }
}

export const settingsService = new SettingsService()
