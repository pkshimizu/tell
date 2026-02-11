import {
  GitHubApiAccount,
  GitHubApiOwner,
  GitHubApiRepository as GitHubApiRepositoryModel,
  GitHubApiPullRequest,
  GitHubApiPullRequestReviewer,
  GitHubPullRequestState,
  GitHubApiStatusChecks,
  GitHubApiCheckRun,
  GitHubApiCheckStatusState
} from '@main/models/github'
import { logGitHubApiRequest } from '@main/logger'

interface GitHubUserResponse {
  login: string
  name: string | null
  html_url: string
  avatar_url: string
  [key: string]: unknown
}

interface GitHubTokenResponse {
  expires_at?: string | null
  [key: string]: unknown
}

interface GitHubOrganizationResponse {
  login: string
  html_url: string
  avatar_url: string
  [key: string]: unknown
}

interface GitHubRepositoryResponse {
  name: string
  html_url: string
  [key: string]: unknown
}

export class GitHubApiRepository {
  private readonly baseUrl = 'https://api.github.com'

  /**
   * Handle API errors and generate user-friendly error messages
   */
  private async handleApiError(response: Response, defaultMessage: string): Promise<never> {
    const errorBody = await response.text()

    // Authentication error
    if (response.status === 401) {
      throw new Error(
        '[AUTH_FAILED] Authentication failed. Please check your GitHub token in settings.'
      )
    }

    // Rate limit error
    if (response.status === 403) {
      try {
        const errorJson = JSON.parse(errorBody)
        if (errorJson.message?.includes('rate limit exceeded')) {
          const resetTime = response.headers.get('x-ratelimit-reset')
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000)
            const formattedTime = resetDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
            throw new Error(
              `GitHub API rate limit exceeded. Please wait until ${formattedTime} to continue.`
            )
          }
          throw new Error('GitHub API rate limit exceeded. Please try again later.')
        }
        // Other 403 errors (e.g., insufficient permissions)
        if (errorJson.message) {
          throw new Error(`Permission denied: ${errorJson.message}`)
        }
      } catch (e) {
        if (
          e instanceof Error &&
          (e.message.includes('rate limit') || e.message.includes('Permission'))
        ) {
          throw e
        }
      }
    }

    // Not found error
    if (response.status === 404) {
      throw new Error(`Resource not found. Please check your repository settings.`)
    }

    // Server error
    if (response.status >= 500) {
      throw new Error('GitHub server error. Please try again later.')
    }

    // Network or other errors
    if (!response.ok) {
      let errorMessage = defaultMessage
      try {
        const errorJson = JSON.parse(errorBody)
        if (errorJson.message) {
          errorMessage = `${defaultMessage}: ${errorJson.message}`
        }
      } catch {
        // If body is not JSON, use status text
        errorMessage = `${defaultMessage}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    throw new Error(`${defaultMessage}: ${response.status} ${response.statusText} - ${errorBody}`)
  }

  async getAccount(personalAccessToken: string): Promise<GitHubApiAccount> {
    const url = `${this.baseUrl}/user`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    logGitHubApiRequest({
      method: 'GET',
      url,
      status: response.status,
      headers: response.headers
    })

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch GitHub user info')
    }

    const data = (await response.json()) as GitHubUserResponse

    return {
      login: data.login,
      name: data.name,
      htmlUrl: data.html_url,
      avatarUrl: data.avatar_url
    }
  }

  async getTokenExpiration(personalAccessToken: string): Promise<Date | null> {
    const url = `${this.baseUrl}/graphql`
    try {
      // GitHub GraphQL APIを使用してトークン情報を取得
      const query = `
        query {
          viewer {
            login
          }
        }
      `

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({ query })
      })

      logGitHubApiRequest({
        method: 'POST',
        url,
        status: response.status,
        headers: response.headers,
        isGraphQL: true
      })

      // GraphQL APIのレスポンスヘッダーから有効期限を確認
      const expirationHeader = response.headers.get('github-authentication-token-expiration')
      if (expirationHeader) {
        return new Date(expirationHeader)
      }

      // レスポンスボディから有効期限を確認（Fine-grained tokenの場合）
      const data = (await response.json()) as GitHubTokenResponse
      if (data.expires_at) {
        return new Date(data.expires_at)
      }

      // 有効期限が取得できない場合はnullを返す
      return null
    } catch (error) {
      // エラーが発生した場合もnullを返す（有効期限は必須ではない）
      console.warn('Failed to fetch token expiration:', error)
      return null
    }
  }

  async getOwners(personalAccessToken: string): Promise<GitHubApiOwner[]> {
    const url = `${this.baseUrl}/user/orgs?per_page=100`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    logGitHubApiRequest({
      method: 'GET',
      url,
      status: response.status,
      headers: response.headers
    })

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch GitHub organizations')
    }

    const data = (await response.json()) as GitHubOrganizationResponse[]

    return data.map((org) => ({
      login: org.login,
      htmlUrl: `https://github.com/${org.login}`,
      avatarUrl: org.avatar_url
    }))
  }

  async getUserRepositories(personalAccessToken: string): Promise<GitHubApiRepositoryModel[]> {
    const url = `${this.baseUrl}/user/repos?affiliation=owner&per_page=100`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    logGitHubApiRequest({
      method: 'GET',
      url,
      status: response.status,
      headers: response.headers
    })

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch user repositories')
    }

    const data = (await response.json()) as GitHubRepositoryResponse[]

    return data.map((repo) => ({
      name: repo.name,
      htmlUrl: repo.html_url
    }))
  }

  async getRepositories(
    personalAccessToken: string,
    ownerLogin: string
  ): Promise<GitHubApiRepositoryModel[]> {
    const url = `${this.baseUrl}/orgs/${ownerLogin}/repos?per_page=100`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    logGitHubApiRequest({
      method: 'GET',
      url,
      status: response.status,
      headers: response.headers
    })

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch repositories')
    }

    const data = (await response.json()) as GitHubRepositoryResponse[]

    return data.map((repo) => ({
      name: repo.name,
      htmlUrl: repo.html_url
    }))
  }

  /**
   * GraphQL APIを使用して複数リポジトリのプルリクエストを一度に取得
   */
  async getPullRequests(
    personalAccessToken: string,
    repositories: Array<{ owner: string; name: string }>,
    state: GitHubPullRequestState
  ): Promise<GitHubApiPullRequest[]> {
    if (repositories.length === 0) {
      return []
    }

    // GraphQL stateの変換 (REST APIのstateとGraphQLのstatesの違い)
    const graphqlState = state === 'open' ? 'OPEN' : 'CLOSED'

    // GraphQLクエリの構築
    // 各リポジトリごとにクエリフラグメントを生成
    const repoQueries = repositories
      .map((repo, index) => {
        const repoAlias = `repo_${index}`
        return `
        ${repoAlias}: repository(owner: "${repo.owner}", name: "${repo.name}") {
          name
          url
          owner {
            login
            url
            avatarUrl
          }
          pullRequests(states: [${graphqlState}], first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              number
              title
              url
              createdAt
              updatedAt
              baseRefName
              headRefName

              author {
                login
                url
                avatarUrl
              }

              assignees(first: 10) {
                nodes {
                  login
                  url
                  avatarUrl
                }
              }

              reviewRequests(first: 10) {
                nodes {
                  requestedReviewer {
                    ... on User {
                      login
                      url
                      avatarUrl
                    }
                    ... on Team {
                      name
                      url
                      avatarUrl
                    }
                  }
                }
              }

              reviews(first: 100) {
                nodes {
                  author {
                    login
                    url
                    avatarUrl
                  }
                  state
                  body
                }
              }

              commits(last: 1) {
                nodes {
                  commit {
                    statusCheckRollup {
                      state
                      contexts(first: 50) {
                        nodes {
                          ... on CheckRun {
                            __typename
                            name
                            status
                            conclusion
                          }
                          ... on StatusContext {
                            __typename
                            context
                            state
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
      })
      .join('\n')

    const query = `
      query GetPullRequests {
        ${repoQueries}
      }
    `

    const url = `${this.baseUrl}/graphql`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({ query })
    })

    logGitHubApiRequest({
      method: 'POST',
      url,
      status: response.status,
      headers: response.headers,
      isGraphQL: true
    })

    if (!response.ok) {
      await this.handleApiError(response, 'Failed to fetch pull requests via GraphQL')
    }

    const data = await response.json()

    // GraphQL APIは200でも認証エラーを返すことがある
    if (data.message === 'Bad credentials') {
      throw new Error(
        '[AUTH_FAILED] Authentication failed. Please check your GitHub token in settings.'
      )
    }

    if (data.errors) {
      // 認証エラーをチェック
      const authError = data.errors.find(
        (e: { type?: string; message?: string }) =>
          e.type === 'UNAUTHORIZED' || e.message?.toLowerCase().includes('unauthorized')
      )
      if (authError) {
        throw new Error(
          '[AUTH_FAILED] Authentication failed. Please check your GitHub token in settings.'
        )
      }
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    // レスポンスデータをGitHubApiPullRequest形式に変換
    const pullRequests: GitHubApiPullRequest[] = []

    for (const key in data.data) {
      const repo = data.data[key]
      if (!repo || !repo.pullRequests || !repo.pullRequests.nodes) continue

      for (const pr of repo.pullRequests.nodes) {
        if (!pr) continue

        // レビュワー情報を集約
        const reviewerMap = new Map<string, GitHubApiPullRequestReviewer>()

        // レビューリクエストされたユーザーを追加
        if (pr.reviewRequests && pr.reviewRequests.nodes) {
          for (const reviewRequest of pr.reviewRequests.nodes) {
            if (reviewRequest?.requestedReviewer) {
              const reviewer = reviewRequest.requestedReviewer
              reviewerMap.set(reviewer.login || reviewer.name, {
                name: reviewer.login || reviewer.name,
                htmlUrl: reviewer.url,
                avatarUrl: reviewer.avatarUrl || '',
                comments: 0,
                status: 'pending'
              })
            }
          }
        }

        // 実際のレビューを処理
        if (pr.reviews && pr.reviews.nodes) {
          for (const review of pr.reviews.nodes) {
            if (!review?.author) continue

            const reviewerLogin = review.author.login
            const existing = reviewerMap.get(reviewerLogin)
            const commentCount = review.body ? 1 : 0

            if (existing) {
              existing.comments += commentCount
              // GraphQL state to our status mapping
              switch (review.state) {
                case 'APPROVED':
                  existing.status = 'approved'
                  break
                case 'CHANGES_REQUESTED':
                  if (existing.status !== 'approved') {
                    existing.status = 'changes_requested'
                  }
                  break
                case 'COMMENTED':
                  if (existing.status !== 'approved' && existing.status !== 'changes_requested') {
                    existing.status = 'commented'
                  }
                  break
                case 'PENDING':
                  if (existing.status === 'pending') {
                    existing.status = 'pending'
                  }
                  break
                case 'DISMISSED':
                  if (existing.status !== 'approved') {
                    existing.status = 'dismissed'
                  }
                  break
              }
            } else {
              const status =
                review.state === 'APPROVED'
                  ? 'approved'
                  : review.state === 'CHANGES_REQUESTED'
                    ? 'changes_requested'
                    : review.state === 'COMMENTED'
                      ? 'commented'
                      : review.state === 'DISMISSED'
                        ? 'dismissed'
                        : 'pending'

              reviewerMap.set(reviewerLogin, {
                name: reviewerLogin,
                htmlUrl: review.author.url,
                avatarUrl: review.author.avatarUrl || '',
                comments: commentCount,
                status
              })
            }
          }
        }

        // Status Checks情報を処理
        let statusChecks: GitHubApiStatusChecks | null = null
        const lastCommit = pr.commits?.nodes?.[0]?.commit
        const statusCheckRollup = lastCommit?.statusCheckRollup

        if (statusCheckRollup) {
          // GraphQL stateを内部の型にマッピング
          const stateMap: Record<string, GitHubApiCheckStatusState> = {
            SUCCESS: 'success',
            FAILURE: 'failure',
            PENDING: 'pending',
            EXPECTED: 'pending',
            ERROR: 'failure'
          }
          const state: GitHubApiCheckStatusState = stateMap[statusCheckRollup.state] || 'pending'

          const checks: GitHubApiCheckRun[] = []
          if (statusCheckRollup.contexts?.nodes) {
            for (const context of statusCheckRollup.contexts.nodes) {
              if (!context) continue

              if (context.__typename === 'CheckRun') {
                checks.push({
                  name: context.name,
                  status: context.status?.toLowerCase() as GitHubApiCheckRun['status'],
                  conclusion: context.conclusion?.toLowerCase() as GitHubApiCheckRun['conclusion']
                })
              } else if (context.__typename === 'StatusContext') {
                // StatusContextをCheckRunの形式に変換
                const statusStateMap: Record<string, GitHubApiCheckRun['conclusion']> = {
                  SUCCESS: 'success',
                  FAILURE: 'failure',
                  PENDING: null,
                  ERROR: 'failure',
                  EXPECTED: null
                }
                checks.push({
                  name: context.context,
                  status: context.state === 'PENDING' ? 'in_progress' : 'completed',
                  conclusion: statusStateMap[context.state] || null
                })
              }
            }
          }

          statusChecks = { state, checks }
        }

        const pullRequest: GitHubApiPullRequest = {
          id: pr.id,
          owner: {
            login: repo.owner.login,
            htmlUrl: repo.owner.url,
            avatarUrl: repo.owner.avatarUrl || ''
          },
          repository: {
            name: repo.name,
            htmlUrl: repo.url
          },
          author: {
            name: pr.author?.login || 'unknown',
            htmlUrl: pr.author?.url || '',
            avatarUrl: pr.author?.avatarUrl || ''
          },
          assignees:
            pr.assignees?.nodes?.map(
              (assignee: { login: string; url: string; avatarUrl?: string }) => ({
                name: assignee.login,
                htmlUrl: assignee.url,
                avatarUrl: assignee.avatarUrl || ''
              })
            ) || [],
          reviewers: Array.from(reviewerMap.values()),
          title: pr.title,
          htmlUrl: pr.url,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt,
          sourceBranch: pr.headRefName,
          targetBranch: pr.baseRefName,
          statusChecks
        }

        pullRequests.push(pullRequest)
      }
    }

    return pullRequests
  }
}

export const githubApiRepository = new GitHubApiRepository()
