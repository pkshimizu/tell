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
  async addGitHubAccount(personalAccessToken: string): Promise<StoreSettingsGitHubAccount> {
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
    return githubStoreRepository.addAccount({
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
  async addGitHubRepository(
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
  async getGitHubRepositories(
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
  async removeGitHubRepository(
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

  /**
   * 全ての登録済みリポジトリを取得する
   * @returns 登録済みリポジトリのリスト（owner/repo形式）
   */
  getAllRegisteredRepositories(): Array<{
    accountId: string
    ownerLogin: string
    repositoryName: string
    repositoryHtmlUrl: string
  }> {
    const allRepositories = githubStoreRepository.getAllRepositories()
    return allRepositories.map(({ account, owner, repository }) => ({
      accountId: account.id,
      ownerLogin: owner.login,
      repositoryName: repository.name,
      repositoryHtmlUrl: repository.htmlUrl
    }))
  }

  /**
   * GitHubアカウントのPersonal Access Tokenを更新する
   * 既存のOwner/Repository情報は維持される
   * @param accountId - GitHubアカウントID (UUID)
   * @param personalAccessToken - 新しいGitHub Personal Access Token
   * @returns 更新されたGitHubアカウント情報
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async updateGitHubAccountToken(
    accountId: string,
    personalAccessToken: string
  ): Promise<StoreSettingsGitHubAccount> {
    // storeからアカウント情報を取得
    const existingAccount = githubStoreRepository.findAccountById(accountId)
    if (!existingAccount) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // 新しいトークンでGitHub APIからアカウント情報を取得して検証
    const accountInfo = await githubApiRepository.getAccount(personalAccessToken)

    // 同じアカウントのトークンであることを確認
    if (accountInfo.login !== existingAccount.login) {
      throw new Error(
        `Token belongs to a different account '${accountInfo.login}'. Expected '${existingAccount.login}'.`
      )
    }

    // トークンの有効期限を取得
    const expiredAt = await githubApiRepository.getTokenExpiration(personalAccessToken)

    // トークンを更新
    const updatedAccount = githubStoreRepository.updateAccountToken(
      accountId,
      personalAccessToken,
      expiredAt ? expiredAt.toISOString() : null
    )

    if (!updatedAccount) {
      throw new Error('Failed to update account token')
    }

    return updatedAccount
  }
}

export const settingsService = new SettingsService()
