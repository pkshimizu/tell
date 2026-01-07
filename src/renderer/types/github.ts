export interface GitHubAccount {
  id: number
  login: string
  name: string | null
  htmlUrl: string
  avatarUrl: string | null
  personalAccessToken: string
  expiredAt: Date | null
}

export interface GitHubOwner {
  login: string
  htmlUrl: string
  avatarUrl: string | null
}

export interface GitHubRepository {
  name: string
  htmlUrl: string
}

export interface GitHubApiPullRequestAssignee {
  name: string
  htmlUrl: string
  avatarUrl: string
}

export interface GitHubApiPullRequestAuthor {
  name: string
  htmlUrl: string
  avatarUrl: string
}

export type GitHubApiPullRequestReviewStatus =
  | 'approved'
  | 'changes_requested'
  | 'commented'
  | 'pending'
  | 'dismissed'

export interface GitHubApiPullRequestReviewer {
  name: string
  htmlUrl: string
  avatarUrl: string
  comments: number
  status: GitHubApiPullRequestReviewStatus
}

export interface GitHubApiPullRequest {
  id: string
  owner: GitHubOwner
  repository: GitHubRepository
  author: GitHubApiPullRequestAuthor
  assignees: GitHubApiPullRequestAssignee[]
  reviewers: GitHubApiPullRequestReviewer[]
  title: string
  htmlUrl: string
  createdAt: string
  updatedAt: string
  sourceBranch: string
  targetBranch: string
}
