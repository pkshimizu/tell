import {
  GitHubApiAccount,
  GitHubApiOwner,
  GitHubApiRepository as GitHubApiRepositoryModel,
  GitHubApiPullRequest,
  GitHubApiPullRequestAssignee,
  GitHubApiPullRequestAuthor,
  GitHubApiPullRequestReviewer,
  GitHubPullRequestState,
  GitHubApiPullRequestStatus
} from '@main/models/github'

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

interface GitHubPullRequestResponse {
  id: number
  number: number
  title: string
  html_url: string
  created_at: string
  updated_at: string
  user: GitHubUserResponse
  assignees: GitHubUserResponse[]
  requested_reviewers: GitHubUserResponse[]
  base: {
    ref: string
    repo: {
      name: string
      html_url: string
      owner: {
        login: string
        html_url: string
        avatar_url: string
      }
    }
  }
  head: {
    ref: string
  }
  [key: string]: unknown
}

interface GitHubReviewResponse {
  id: number
  user: GitHubUserResponse
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED'
  body: string | null
  [key: string]: unknown
}

export class GitHubApiRepository {
  private readonly baseUrl = 'https://api.github.com'

  /**
   * レート制限エラーをチェックして、わかりやすいエラーメッセージを生成する
   */
  private async handleApiError(response: Response, defaultMessage: string): Promise<never> {
    const errorBody = await response.text()

    // レート制限エラーのチェック
    if (response.status === 403) {
      try {
        const errorJson = JSON.parse(errorBody)
        if (errorJson.message?.includes('rate limit exceeded')) {
          const resetTime = response.headers.get('x-ratelimit-reset')
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000)
            throw new Error(
              `GitHub API rate limit exceeded. Please try again after ${resetDate.toLocaleTimeString()}.`
            )
          }
          throw new Error('GitHub API rate limit exceeded. Please try again later.')
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('rate limit')) {
          throw e
        }
      }
    }

    throw new Error(`${defaultMessage}: ${response.status} ${response.statusText} - ${errorBody}`)
  }

  async getAccount(personalAccessToken: string): Promise<GitHubApiAccount> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
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
    try {
      // GitHub GraphQL APIを使用してトークン情報を取得
      const query = `
        query {
          viewer {
            login
          }
        }
      `

      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({ query })
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
    const response = await fetch(`${this.baseUrl}/user/orgs?per_page=100`, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to fetch GitHub owners: ${response.status} ${response.statusText} - ${errorBody}`
      )
    }

    const data = (await response.json()) as GitHubOrganizationResponse[]

    return data.map((org) => ({
      login: org.login,
      htmlUrl: `https://github.com/${org.login}`,
      avatarUrl: org.avatar_url
    }))
  }

  async getUserRepositories(personalAccessToken: string): Promise<GitHubApiRepositoryModel[]> {
    const response = await fetch(`${this.baseUrl}/user/repos?affiliation=owner&per_page=100`, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to fetch user repositories: ${response.status} ${response.statusText} - ${errorBody}`
      )
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
    const response = await fetch(`${this.baseUrl}/orgs/${ownerLogin}/repos?per_page=100`, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to fetch GitHub repositories: ${response.status} ${response.statusText} - ${errorBody}`
      )
    }

    const data = (await response.json()) as GitHubRepositoryResponse[]

    return data.map((repo) => ({
      name: repo.name,
      htmlUrl: repo.html_url
    }))
  }

  async getPullRequests(
    personalAccessToken: string,
    ownerLogin: string,
    repositoryName: string,
    state: GitHubPullRequestState
  ): Promise<GitHubApiPullRequest[]> {
    // PR一覧を取得
    const pullsResponse = await fetch(
      `${this.baseUrl}/repos/${ownerLogin}/${repositoryName}/pulls?state=${state}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!pullsResponse.ok) {
      await this.handleApiError(pullsResponse, 'Failed to fetch pull requests')
    }

    const pulls = (await pullsResponse.json()) as GitHubPullRequestResponse[]

    // 各PRのレビュー情報を取得
    return await Promise.all(
      pulls.map(async (pull) => {
        const reviewsResponse = await fetch(
          `${this.baseUrl}/repos/${ownerLogin}/${repositoryName}/pulls/${pull.number}/reviews`,
          {
            headers: {
              Authorization: `Bearer ${personalAccessToken}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            }
          }
        )

        let reviews: GitHubReviewResponse[] = []
        if (reviewsResponse.ok) {
          reviews = (await reviewsResponse.json()) as GitHubReviewResponse[]
        }

        // PR作成者情報を変換
        const author: GitHubApiPullRequestAuthor = {
          name: pull.user.login,
          htmlUrl: pull.user.html_url,
          avatarUrl: pull.user.avatar_url
        }

        // アサイニー情報を変換
        const assignees: GitHubApiPullRequestAssignee[] = pull.assignees.map((assignee) => ({
          name: assignee.login,
          htmlUrl: assignee.html_url,
          avatarUrl: assignee.avatar_url
        }))

        // レビュワー情報を集約
        const reviewerMap = new Map<string, GitHubApiPullRequestReviewer>()

        // リクエストされたレビュワーを追加（まだレビューしていない）
        pull.requested_reviewers.forEach((reviewer) => {
          reviewerMap.set(reviewer.login, {
            name: reviewer.login,
            htmlUrl: reviewer.html_url,
            avatarUrl: reviewer.avatar_url,
            comments: 0,
            status: 'pending'
          })
        })

        // 実際のレビューを処理
        reviews.forEach((review) => {
          const reviewerLogin = review.user.login
          const existing = reviewerMap.get(reviewerLogin)

          // コメント数をカウント（bodyがある場合）
          const commentCount = review.body ? 1 : 0

          if (existing) {
            // 既存のレビュワーを更新
            existing.comments += commentCount
            // ステータスを更新（APPROVEDが最優先）
            switch (review.state) {
              case 'APPROVED':
                existing.status = 'approved'
                break
              case 'CHANGES_REQUESTED':
                existing.status = 'changes_requested'
                break
              case 'COMMENTED':
                if (existing.status !== 'approved') {
                  existing.status = 'commented'
                }
                break
              case 'PENDING':
                if (existing.status !== 'approved') {
                  existing.status = 'pending'
                }
                break
              case 'DISMISSED':
                if (existing.status !== 'approved') {
                  existing.status = 'dismissed'
                }
            }
          } else {
            // 新しいレビュワーを追加
            reviewerMap.set(reviewerLogin, {
              name: reviewerLogin,
              htmlUrl: review.user.html_url,
              avatarUrl: review.user.avatar_url,
              comments: commentCount,
              status: review.state.toLowerCase() as GitHubApiPullRequestStatus
            })
          }
        })

        const reviewers = Array.from(reviewerMap.values())

        // GitHubApiPullRequestオブジェクトを作成
        const pullRequest: GitHubApiPullRequest = {
          id: pull.id.toString(),
          owner: {
            login: pull.base.repo.owner.login,
            htmlUrl: pull.base.repo.owner.html_url,
            avatarUrl: pull.base.repo.owner.avatar_url
          },
          repository: {
            name: pull.base.repo.name,
            htmlUrl: pull.base.repo.html_url
          },
          author,
          assignees,
          reviewers,
          title: pull.title,
          htmlUrl: pull.html_url,
          createdAt: pull.created_at,
          updatedAt: pull.updated_at,
          sourceBranch: pull.head.ref,
          targetBranch: pull.base.ref
        }

        return pullRequest
      })
    )
  }
}

export const githubApiRepository = new GitHubApiRepository()
