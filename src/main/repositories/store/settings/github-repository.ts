import { getStore } from '@main/store'
import type {
  StoreSettingsGitHubAccount,
  StoreSettingsGitHubOwner,
  StoreSettingsGitHubRepository
} from '@main/models/store/settings/github'
import { randomUUID } from 'crypto'

/**
 * electron-storeを使用したGitHub情報管理リポジトリ
 * 階層構造でデータを管理: Account -> Owner -> Repository
 */
export class StoreSettingsGithubRepository {
  private readonly GITHUB_KEY = 'settings.github'

  /**
   * 全てのGitHubアカウントを取得する
   */
  findAllAccounts(): StoreSettingsGitHubAccount[] {
    const store = getStore()
    const github = store.get(this.GITHUB_KEY)
    return github.accounts
  }

  /**
   * IDでGitHubアカウントを検索する
   */
  findAccountById(id: string): StoreSettingsGitHubAccount | undefined {
    const accounts = this.findAllAccounts()
    return accounts.find((account) => account.id === id)
  }

  /**
   * loginでGitHubアカウントを検索する
   */
  findAccountByLogin(login: string): StoreSettingsGitHubAccount | undefined {
    const accounts = this.findAllAccounts()
    return accounts.find((account) => account.login === login)
  }

  /**
   * 新規GitHubアカウントを登録する
   */
  addAccount(data: Omit<StoreSettingsGitHubAccount, 'id' | 'owners'>): StoreSettingsGitHubAccount {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const newAccount: StoreSettingsGitHubAccount = {
      id: randomUUID(),
      ...data,
      owners: []
    }
    accounts.push(newAccount)
    store.set(this.GITHUB_KEY, { accounts })
    return newAccount
  }

  /**
   * GitHubアカウントを更新する
   */
  updateAccount(
    id: string,
    data: Partial<Omit<StoreSettingsGitHubAccount, 'id' | 'owners'>>
  ): StoreSettingsGitHubAccount | undefined {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const index = accounts.findIndex((account) => account.id === id)
    if (index === -1) return undefined

    accounts[index] = { ...accounts[index], ...data }
    store.set(this.GITHUB_KEY, { accounts })
    return accounts[index]
  }

  /**
   * GitHubアカウントのPersonal Access Tokenを更新する
   * 既存のOwner/Repository情報は維持される
   */
  updateAccountToken(
    id: string,
    personalAccessToken: string,
    expiredAt: string | null
  ): StoreSettingsGitHubAccount | undefined {
    return this.updateAccount(id, { personalAccessToken, expiredAt })
  }

  /**
   * GitHubアカウントを削除する
   */
  deleteAccount(id: string): void {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const filtered = accounts.filter((account) => account.id !== id)
    store.set(this.GITHUB_KEY, { accounts: filtered })
  }

  /**
   * アカウントに紐づく全てのOwnerを取得する
   */
  findAllOwnersByAccountId(accountId: string): StoreSettingsGitHubOwner[] {
    const account = this.findAccountById(accountId)
    return account?.owners || []
  }

  /**
   * アカウントIDとOwner loginでOwnerを検索する
   */
  findOwnerByAccountIdAndLogin(
    accountId: string,
    ownerLogin: string
  ): StoreSettingsGitHubOwner | undefined {
    const account = this.findAccountById(accountId)
    return account?.owners.find((owner) => owner.login === ownerLogin)
  }

  /**
   * Ownerを追加または更新する
   */
  upsertOwner(accountId: string, ownerData: StoreSettingsGitHubOwner): StoreSettingsGitHubOwner {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const accountIndex = accounts.findIndex((account) => account.id === accountId)
    if (accountIndex === -1) {
      throw new Error(`Account with id ${accountId} not found`)
    }

    const owners = accounts[accountIndex].owners
    const ownerIndex = owners.findIndex((owner) => owner.login === ownerData.login)

    if (ownerIndex === -1) {
      // 新規作成
      owners.push(ownerData)
    } else {
      // 更新
      owners[ownerIndex] = { ...owners[ownerIndex], ...ownerData }
    }

    store.set(this.GITHUB_KEY, { accounts })
    return ownerData
  }

  /**
   * Owner loginでRepositoryを検索する
   */
  findRepositoriesByOwner(accountId: string, ownerLogin: string): StoreSettingsGitHubRepository[] {
    const owner = this.findOwnerByAccountIdAndLogin(accountId, ownerLogin)
    return owner?.repositories || []
  }

  /**
   * Repositoryを追加する
   */
  addRepository(
    accountId: string,
    ownerLogin: string,
    repositoryData: StoreSettingsGitHubRepository
  ): StoreSettingsGitHubRepository {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const accountIndex = accounts.findIndex((account) => account.id === accountId)
    if (accountIndex === -1) {
      throw new Error(`Account with id ${accountId} not found`)
    }

    const owners = accounts[accountIndex].owners
    const ownerIndex = owners.findIndex((owner) => owner.login === ownerLogin)
    if (ownerIndex === -1) {
      throw new Error(`Owner with login ${ownerLogin} not found`)
    }

    const repositories = owners[ownerIndex].repositories
    const existingRepo = repositories.find((repo) => repo.name === repositoryData.name)
    if (existingRepo) {
      return existingRepo
    }

    repositories.push(repositoryData)
    store.set(this.GITHUB_KEY, { accounts })
    return repositoryData
  }

  /**
   * Repositoryを削除する
   */
  deleteRepository(accountId: string, ownerLogin: string, repositoryName: string): void {
    const store = getStore()
    const accounts = this.findAllAccounts()
    const accountIndex = accounts.findIndex((account) => account.id === accountId)
    if (accountIndex === -1) return

    const owners = accounts[accountIndex].owners
    const ownerIndex = owners.findIndex((owner) => owner.login === ownerLogin)
    if (ownerIndex === -1) return

    const repositories = owners[ownerIndex].repositories
    owners[ownerIndex].repositories = repositories.filter((repo) => repo.name !== repositoryName)

    store.set(this.GITHUB_KEY, { accounts })
  }

  /**
   * 全てのアカウントの全てのリポジトリを取得する
   * プルリクエスト取得用
   */
  getAllRepositories(): Array<{
    account: StoreSettingsGitHubAccount
    owner: StoreSettingsGitHubOwner
    repository: StoreSettingsGitHubRepository
  }> {
    const accounts = this.findAllAccounts()
    const result: Array<{
      account: StoreSettingsGitHubAccount
      owner: StoreSettingsGitHubOwner
      repository: StoreSettingsGitHubRepository
    }> = []

    for (const account of accounts) {
      for (const owner of account.owners) {
        for (const repository of owner.repositories) {
          result.push({ account, owner, repository })
        }
      }
    }

    return result
  }
}

export const githubStoreRepository = new StoreSettingsGithubRepository()
