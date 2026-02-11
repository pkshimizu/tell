import { ElectronAPI } from '@electron-toolkit/preload'
import type { GithubAccount, GithubRepository } from '@main/database/schemas'
import type {
  GitHubApiOrganization,
  GitHubApiPullRequest,
  GitHubApiRepository as GitHubApiRepositoryModel
} from '@main/models/github'

type ThemeMode = 'light' | 'dark' | 'system'

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

type SortKey = 'createdAt' | 'updatedAt' | 'author'
type SortOrder = 'asc' | 'desc'
type ReloadInterval = 1 | 3 | 5 | 10 | 15

interface SettingsPullRequestsAPI {
  get: () => Promise<{
    success: boolean
    data?: { sortBy: SortKey; sortOrder: SortOrder; reloadInterval: ReloadInterval }
    error?: string
  }>
  set: (
    sortBy: SortKey,
    sortOrder: SortOrder,
    reloadInterval: ReloadInterval
  ) => Promise<{
    success: boolean
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
  getAllRegisteredRepositories: () => Promise<{
    success: boolean
    data?: Array<{
      accountId: string
      ownerLogin: string
      repositoryName: string
      repositoryHtmlUrl: string
    }>
    error?: string
  }>
  updateAccountToken: (
    accountId: string,
    personalAccessToken: string
  ) => Promise<{
    success: boolean
    data?: GithubAccount
    error?: string
  }>
  deleteAccount: (accountId: string) => Promise<{
    success: boolean
    error?: string
  }>
}

interface AppAPI {
  getVersion: () => Promise<string>
}

interface ThemeAPI {
  get: () => Promise<ThemeMode>
  set: (mode: ThemeMode) => Promise<{
    success: boolean
    error?: string
  }>
}

interface DebugStoreAPI {
  getAll: () => Promise<{
    success: boolean
    data?: string // JSON文字列として受け取る
    error?: string
  }>
  openConfig: () => Promise<{
    success: boolean
    error?: string
  }>
}

interface API {
  github: GitHubAPI
  settings: {
    github: SettingsGitHubAPI
    pullRequests: SettingsPullRequestsAPI
  }
  app: AppAPI
  theme: ThemeAPI
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
