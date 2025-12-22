import TAlert from '@renderer/components/feedback/alert'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import { useCallback, useEffect, useState } from 'react'
import { GitHubApiPullRequest, GitHubOwner, GitHubRepository } from '@renderer/types/github'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import GitHubIcon from '@renderer/components/display/icons/github'
import TIconButton from '@renderer/components/form/icon-button'
import { IoRefresh } from 'react-icons/io5'

type Props = {
  state: 'open' | 'closed'
}

type OwnerRepositories = {
  owner: GitHubOwner
  repositories: Map<string, RepositoryPullRequests>
}

type RepositoryPullRequests = {
  owner: GitHubOwner
  repository: GitHubRepository
  pullRequests: GitHubApiPullRequest[]
}

function groupingPullRequests(pullRequests: GitHubApiPullRequest[]): OwnerRepositories[] {
  const owners = new Map<string, OwnerRepositories>()
  for (const pullRequest of pullRequests) {
    if (!owners.has(pullRequest.owner.login)) {
      owners.set(pullRequest.owner.login, { owner: pullRequest.owner, repositories: new Map() })
    }
    const owner = owners.get(pullRequest.owner.login)!
    if (!owner.repositories.has(pullRequest.repository.name)) {
      owner.repositories.set(pullRequest.repository.name, {
        owner: pullRequest.owner,
        repository: pullRequest.repository,
        pullRequests: []
      })
    }
    const repository = owner.repositories.get(pullRequest.repository.name)!
    repository.pullRequests.push(pullRequest)
  }
  return Array.from(owners.values())
}

export default function GitHubPullRequestsPanel(props: Props) {
  const [pullRequests, setPullRequests] = useState<GitHubApiPullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPullRequests = useCallback(
    async (showLoading: boolean = false): Promise<void> => {
      try {
        if (showLoading) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }
        setError(null)
        const result = await window.api.github.getPullRequests(props.state)
        if (result.success && result.data) {
          setPullRequests(result.data as GitHubApiPullRequest[])
        } else {
          setError(result.error || 'Failed to fetch pull requests')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        if (showLoading) {
          setLoading(false)
        } else {
          setRefreshing(false)
        }
      }
    },
    [props.state]
  )

  const handleRefresh = useCallback(() => {
    void fetchPullRequests(false)
  }, [fetchPullRequests])

  useEffect(() => {
    // 初回読み込み
    void fetchPullRequests(true)

    // 5分ごとにポーリング
    // GitHub APIのレート制限: 5,000リクエスト/時間
    // 5分間隔であれば、最大12リクエスト/時間となり、レート制限に余裕がある
    const intervalId = setInterval(
      () => {
        void fetchPullRequests(false)
      },
      5 * 60 * 1000
    ) // 5分 = 300,000ms

    // クリーンアップ
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchPullRequests])

  return (
    <TColumn gap={1}>
      <TRow align="center" justify="space-between">
        <TRow align="center" gap={1}>
          <GitHubIcon />
          <TText>Open Pull Requests</TText>
        </TRow>
        <TIconButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <TCircularProgress size={24} /> : <IoRefresh size={24} />}
        </TIconButton>
      </TRow>

      {loading ? (
        <TColumn gap={1} align="center">
          <TCircularProgress size={40} />
          <TText>Loading pull requests...</TText>
        </TColumn>
      ) : error ? (
        <TAlert severity="error">{error}</TAlert>
      ) : pullRequests.length === 0 ? (
        <TAlert severity={'info'}>No pull requests</TAlert>
      ) : (
        <>
          {groupingPullRequests(pullRequests).map((owner) =>
            Array.from(owner.repositories.values()).map((repository) => (
              <TColumn key={repository.repository.htmlUrl} gap={1}>
                <TRow gap={1}>
                  <TAvatar alt={owner.owner.login} url={owner.owner.avatarUrl!} size={24} />
                  <TText>{owner.owner.login}</TText>
                  <TText>/</TText>
                  <TText>{repository.repository.name}</TText>
                </TRow>
                {repository.pullRequests.map((pullRequest) => (
                  <GitHubPullRequestView key={pullRequest.htmlUrl} pullRequest={pullRequest} />
                ))}
              </TColumn>
            ))
          )}
        </>
      )}
    </TColumn>
  )
}
