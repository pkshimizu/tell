import { githubApiRepository } from '@main/repositories/github/api-repository'
import { githubAccountRepository } from '@main/repositories/github/account-repository'
import { githubOwnerRepository } from '@main/repositories/github/owner-repository'
import { githubRepositoryRepository } from '@main/repositories/github/repository-repository'
import type { GithubAccount, GithubRepository } from '@main/database/schemas'
import type { GitHubApiOwner, GitHubApiRepository } from '@main/models/github'

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
   * GitHubアカウントIDからオーナー一覧を取得する
   * @param accountId - GitHubアカウントID
   * @returns オーナー一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getOwners(accountId: number): Promise<GitHubApiOwner[]> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
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
   * @param accountId - GitHubアカウントID
   * @param ownerLogin - オーナー名
   * @returns リポジトリ一覧
   * @throws Error - アカウントが見つからない場合、またはAPI呼び出しが失敗した場合
   */
  async getRepositories(accountId: number, ownerLogin: string): Promise<GitHubApiRepository[]> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
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
   * リポジトリを選択してDBに保存する
   * @param accountId - GitHubアカウントID
   * @param ownerLogin - オーナー名
   * @param ownerHtmlUrl - オーナーのHTML URL
   * @param ownerAvatarUrl - オーナーのアバターURL
   * @param repositoryName - リポジトリ名
   * @param repositoryHtmlUrl - リポジトリのHTML URL
   * @returns 保存されたGitHubリポジトリ
   * @throws Error - アカウントが見つからない場合、またはDB操作が失敗した場合
   */
  async addRepository(
    accountId: number,
    ownerLogin: string,
    ownerHtmlUrl: string,
    ownerAvatarUrl: string | null,
    repositoryName: string,
    repositoryHtmlUrl: string
  ): Promise<GithubRepository> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // オーナーが既に存在するかチェック
    let owner = await githubOwnerRepository.findByAccountIdAndLogin(accountId, ownerLogin)
    if (!owner) {
      // オーナーが存在しない場合は新規作成
      owner = await githubOwnerRepository.create({
        githubAccountId: accountId,
        login: ownerLogin,
        htmlUrl: ownerHtmlUrl,
        avatarUrl: ownerAvatarUrl
      })
    }

    // リポジトリが既に存在するかチェック
    const existingRepository = await githubRepositoryRepository.findByOwnerIdAndName(
      owner.id,
      repositoryName
    )
    if (existingRepository) {
      // 既に登録されている場合はそれを返す
      return existingRepository
    }

    // リポジトリを新規作成
    return await githubRepositoryRepository.create({
      githubOwnerId: owner.id,
      name: repositoryName,
      htmlUrl: repositoryHtmlUrl
    })
  }

  /**
   * GitHubアカウントIDとオーナー名から選択済みリポジトリを取得する
   * @param accountId - GitHubアカウントID
   * @param ownerLogin - オーナー名
   * @returns 選択済みリポジトリのリスト
   * @throws Error - アカウントが見つからない場合
   */
  async getRegisteredRepositories(
    accountId: number,
    ownerLogin: string
  ): Promise<GithubRepository[]> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // オーナーを検索
    const owner = await githubOwnerRepository.findByAccountIdAndLogin(accountId, ownerLogin)
    if (!owner) {
      // オーナーが存在しない場合は空配列を返す
      return []
    }

    // オーナーに紐づくリポジトリを取得
    return await githubRepositoryRepository.findByOwnerId(owner.id)
  }

  /**
   * リポジトリの選択を解除（DBから削除）する
   * @param accountId - GitHubアカウントID
   * @param ownerLogin - オーナー名
   * @param repositoryName - リポジトリ名
   * @throws Error - アカウントが見つからない場合、またはDB操作が失敗した場合
   */
  async removeRepository(
    accountId: number,
    ownerLogin: string,
    repositoryName: string
  ): Promise<void> {
    // DBからアカウント情報を取得
    const account = await githubAccountRepository.findById(accountId)
    if (!account) {
      throw new Error(`GitHub account with id '${accountId}' not found`)
    }

    // オーナーを検索
    const owner = await githubOwnerRepository.findByAccountIdAndLogin(accountId, ownerLogin)
    if (!owner) {
      // オーナーが存在しない場合は何もしない
      return
    }

    // リポジトリを検索
    const repository = await githubRepositoryRepository.findByOwnerIdAndName(
      owner.id,
      repositoryName
    )
    if (!repository) {
      // リポジトリが存在しない場合は何もしない
      return
    }

    // リポジトリを削除
    await githubRepositoryRepository.delete(repository.id)
  }
}

export const githubService = new GitHubService()
