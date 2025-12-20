import {
  GitHubApiAccount,
  GitHubApiOwner,
  GitHubApiRepository as GitHubApiRepositoryModel,
  GitHubApiPullRequest,
  GitHubApiPullRequestAssignee,
  GitHubApiPullRequestReviewer,
  GitHubPullRequestState
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

  async getAccount(personalAccessToken: string): Promise<GitHubApiAccount> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to fetch GitHub user info: ${response.status} ${response.statusText} - ${errorBody}`
      )
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
      const errorBody = await pullsResponse.text()
      throw new Error(
        `Failed to fetch pull requests: ${pullsResponse.status} ${pullsResponse.statusText} - ${errorBody}`
      )
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

        // アサイニー情報を変換
        const assignees: GitHubApiPullRequestAssignee[] = pull.assignees.map((assignee) => ({
          name: assignee.login,
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
            status: 'no-review'
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
            if (review.state === 'APPROVED') {
              existing.status = 'approved'
            } else if (existing.status !== 'approved' && review.state === 'COMMENTED') {
              existing.status = 'commented'
            }
          } else {
            // 新しいレビュワーを追加
            reviewerMap.set(reviewerLogin, {
              name: reviewerLogin,
              htmlUrl: review.user.html_url,
              avatarUrl: review.user.avatar_url,
              comments: commentCount,
              status: review.state === 'APPROVED' ? 'approved' : 'commented'
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
          assignees,
          reviewers,
          title: pull.title,
          htmlUrl: pull.html_url,
          createdAt: pull.created_at,
          updatedAt: pull.updated_at
        }

        return pullRequest
      })
    )
  }
}

export const githubApiRepository = new GitHubApiRepository()
