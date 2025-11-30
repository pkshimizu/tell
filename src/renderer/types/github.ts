export interface GitHubAccount {
  id: number
  login: string
  name: string | null
  htmlUrl: string
  avatarUrl: string | null
  personalAccessToken: string
  expiredAt: Date | null
}
