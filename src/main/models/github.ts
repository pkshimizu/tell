export interface GitHubApiAccount {
  login: string
  name: string | null
  htmlUrl: string
  avatarUrl: string
}

export interface GitHubApiOrganization {
  login: string
  htmlUrl: string
  avatarUrl: string
}
