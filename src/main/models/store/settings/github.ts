/**
 * electron-storeで管理するGitHubリポジトリ情報
 */
export interface StoreSettingsGitHubRepository {
  name: string
  htmlUrl: string
}

/**
 * electron-storeで管理するGitHubオーナー情報
 */
export interface StoreSettingsGitHubOwner {
  login: string
  htmlUrl: string
  avatarUrl: string | null
  repositories: StoreSettingsGitHubRepository[]
}

/**
 * electron-storeで管理するGitHubアカウント情報
 */
export interface StoreSettingsGitHubAccount {
  id: string // UUID
  login: string
  name: string | null
  htmlUrl: string
  avatarUrl: string | null
  personalAccessToken: string
  expiredAt: string | null // ISO 8601 string
  owners: StoreSettingsGitHubOwner[]
}

/**
 * electron-storeで管理するGitHub設定
 */
export interface StoreSettingsGitHub {
  accounts: StoreSettingsGitHubAccount[]
}

/**
 * electron-storeのスキーマ定義
 */
export interface StoreSchema {
  settings: {
    github: StoreSettingsGitHub
  }
}
