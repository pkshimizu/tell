export interface GitHubApiAccount {
  login: string
  name: string | null
  htmlUrl: string
  avatarUrl: string
}

export interface GitHubApiOwner {
  login: string
  htmlUrl: string
  avatarUrl: string | null
}

export interface GitHubApiRepository {
  name: string
  htmlUrl: string
}
