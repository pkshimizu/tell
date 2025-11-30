import { GitHubApiAccount } from '@main/models/github'

interface GitHubUserResponse {
  login: string
  name: string | null
  html_url: string
  avatar_url: string
  [key: string]: unknown
}

interface GitHubTokenInfo {
  expires_at?: string | null
  [key: string]: unknown
}

export class GitHubApiRepository {
  private readonly baseUrl = 'https://api.github.com'

  async getAccountInfo(personalAccessToken: string): Promise<GitHubApiAccount> {
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
      const data = (await response.json()) as GitHubTokenInfo
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
}

export const githubApiRepository = new GitHubApiRepository()
