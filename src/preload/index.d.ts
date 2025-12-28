import { ElectronAPI } from '@electron-toolkit/preload'
import type { GithubAccount, GithubRepository } from '@main/database/schemas'
import type {
  GitHubApiOrganization,
  GitHubApiPullRequest,
  GitHubApiRepository as GitHubApiRepositoryModel
} from '@main/models/github'
import type { StoreSchema } from '@main/models/store/settings/github'

interface GitHubAPI {
  getOwners: (accountId: number) => Promise<{
    success: boolean
    data?: GitHubApiOrganization[]
    error?: string
  }>
  getRepositories: (
    accountId: number,
    organizationLogin: string
  ) => Promise<{
    success: boolean
    data?: GitHubApiRepositoryModel[]
    error?: string
  }>
  getPullRequests: (state: 'open' | 'closed') => Promise<{
    success: boolean
    data?: GitHubApiPullRequest[]
    error?: string
  }>
}

interface SettingsGitHubAPI {
  addAccount: (personalAccessToken: string) => Promise<{
    success: boolean
    data?: GithubAccount
    error?: string
  }>
  getAccounts: () => Promise<{
    success: boolean
    data?: GithubAccount[]
    error?: string
  }>
  addRepository: (
    accountId: number,
    ownerLogin: string,
    ownerHtmlUrl: string,
    ownerAvatarUrl: string | null,
    repositoryName: string,
    repositoryHtmlUrl: string
  ) => Promise<{
    success: boolean
    data?: GithubRepository
    error?: string
  }>
  getRepositories: (
    accountId: number,
    ownerLogin: string
  ) => Promise<{
    success: boolean
    data?: GithubRepository[]
    error?: string
  }>
  removeRepository: (
    accountId: number,
    ownerLogin: string,
    repositoryName: string
  ) => Promise<{
    success: boolean
    error?: string
  }>
}

interface AppAPI {
  getVersion: () => Promise<string>
}

interface DebugStoreAPI {
  getAll: () => Promise<{
    success: boolean
    data?: StoreSchema
    error?: string
  }>
}

interface API {
  github: GitHubAPI
  settings: {
    github: SettingsGitHubAPI
  }
  app: AppAPI
  debug: {
    store: DebugStoreAPI
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
