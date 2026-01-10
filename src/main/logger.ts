import log from 'electron-log/main'

// ログファイルの設定
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// GitHub API用ロガーのスコープを作成
const githubLogger = log.scope('github-api')

/**
 * GitHub APIレスポンスからレート制限情報を抽出
 */
interface RateLimitInfo {
  remaining: number | null
  limit: number | null
  reset: Date | null
  used: number | null
}

function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  const remaining = headers.get('x-ratelimit-remaining')
  const limit = headers.get('x-ratelimit-limit')
  const reset = headers.get('x-ratelimit-reset')
  const used = headers.get('x-ratelimit-used')

  return {
    remaining: remaining ? parseInt(remaining, 10) : null,
    limit: limit ? parseInt(limit, 10) : null,
    reset: reset ? new Date(parseInt(reset, 10) * 1000) : null,
    used: used ? parseInt(used, 10) : null
  }
}

/**
 * レート制限の残り割合を計算
 */
function calculateRateLimitPercentage(info: RateLimitInfo): number | null {
  if (info.remaining === null || info.limit === null || info.limit === 0) {
    return null
  }
  return (info.remaining / info.limit) * 100
}

/**
 * レート制限情報をフォーマット
 */
function formatRateLimitInfo(info: RateLimitInfo): string {
  const parts: string[] = []

  if (info.remaining !== null && info.limit !== null) {
    parts.push(`remaining=${info.remaining}/${info.limit}`)
  }

  if (info.reset) {
    parts.push(`reset=${info.reset.toLocaleTimeString()}`)
  }

  return parts.length > 0 ? `[${parts.join(', ')}]` : ''
}

/**
 * GitHub APIリクエストのログパラメータ
 */
export interface GitHubApiLogParams {
  method: string
  url: string
  status: number
  headers: Headers
  error?: Error
  isGraphQL?: boolean
}

/**
 * GitHub APIリクエストをログに記録
 *
 * - 通常リクエスト: DEBUG
 * - レート制限警告（残り10%未満）: WARN
 * - レート制限エラー（403）: ERROR
 * - その他のエラー: ERROR
 */
export function logGitHubApiRequest(params: GitHubApiLogParams): void {
  const { method, url, status, headers, error, isGraphQL } = params
  const rateLimitInfo = extractRateLimitInfo(headers)
  const rateLimitPercentage = calculateRateLimitPercentage(rateLimitInfo)
  const rateLimitStr = formatRateLimitInfo(rateLimitInfo)

  const requestType = isGraphQL ? 'GraphQL' : 'REST'
  const baseMessage = `${requestType} ${method} ${url} -> ${status} ${rateLimitStr}`

  // エラーの場合
  if (error || status >= 400) {
    // レート制限エラー
    if (status === 403 && rateLimitInfo.remaining === 0) {
      githubLogger.error(`Rate limit exceeded: ${baseMessage}`, error?.message || '')
      return
    }
    // その他のエラー
    githubLogger.error(`${baseMessage}`, error?.message || '')
    return
  }

  // レート制限警告（残り10%未満）
  if (rateLimitPercentage !== null && rateLimitPercentage < 10) {
    githubLogger.warn(
      `Rate limit warning (${rateLimitPercentage.toFixed(1)}% remaining): ${baseMessage}`
    )
    return
  }

  // 通常のリクエスト
  githubLogger.debug(baseMessage)
}

export { log as logger }
