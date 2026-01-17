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

export type GitHubApiCheckStatusState = 'success' | 'failure' | 'pending' | 'in_progress'

export type GitHubApiCheckRunStatus = 'queued' | 'in_progress' | 'completed'

export type GitHubApiCheckRunConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | null

export interface GitHubApiCheckRun {
  name: string
  status: GitHubApiCheckRunStatus
  conclusion: GitHubApiCheckRunConclusion
}

export interface GitHubApiStatusChecks {
  state: GitHubApiCheckStatusState
  checks: GitHubApiCheckRun[]
}

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
  statusChecks: GitHubApiStatusChecks | null
}
