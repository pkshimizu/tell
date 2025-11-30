import { ElectronAPI } from '@electron-toolkit/preload'
import type { GithubAccount } from '@main/database/schemas'

interface GitHubAPI {
  createAccount: (personalAccessToken: string) => Promise<{
    success: boolean
    data?: GithubAccount
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
