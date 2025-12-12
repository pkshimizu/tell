import { ElectronAPI } from '@electron-toolkit/preload'
import type { GithubAccount } from '@main/database/schemas'
import type {
  GitHubApiOrganization,
  GitHubApiRepository as GitHubApiRepositoryModel
} from '@main/models/github'

interface GitHubAPI {
  createAccount: (personalAccessToken: string) => Promise<{
    success: boolean
    data?: GithubAccount
    error?: string
  }>
  getAccounts: () => Promise<{
    success: boolean
    data?: GithubAccount[]
    error?: string
  }>
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
}

interface API {
  github: GitHubAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
