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

export type GitHubApiPullRequestStatus =
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
  status: GitHubApiPullRequestStatus
}

export type GitHubPullRequestState = 'open' | 'closed'

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

export interface GitHubApiPullRequest {
  id: string
  owner: GitHubApiOwner
  repository: GitHubApiRepository
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
