import TAlert from '@renderer/components/feedback/alert'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import { useCallback, useEffect, useState } from 'react'
import {
  GitHubAccount,
  GitHubApiPullRequest,
  GitHubOwner,
  GitHubRepository
} from '@renderer/types/github'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import GitHubIcon from '@renderer/components/display/icons/github'
import TIconButton from '@renderer/components/form/icon-button'
import TButton from '@renderer/components/form/button'
import { IoRefresh } from 'react-icons/io5'
import useMessage from '@renderer/hooks/message'
import usePullRequests from '@renderer/hooks/pull-requests'
import TCheckbox from '@renderer/components/form/checkbox'
import { useForm } from 'react-hook-form'
import useText from '@renderer/hooks/text'

type Props = {
  state: 'open' | 'closed'
}

type FilterFormData = {
  filterMyPRs: boolean
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
  const text = useText()
  const message = useMessage()
  const {
    pullRequests,
    loading,
    refreshing,
    error,
    lastFetchedAt,
    fetchPullRequests,
    refreshPullRequests
  } = usePullRequests()
  const [accounts, setAccounts] = useState<GitHubAccount[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { control, watch } = useForm<FilterFormData>({
    defaultValues: {
      filterMyPRs: true
    }
  })

  const filterMyPRs = watch('filterMyPRs')

  const handleRefresh = useCallback(async () => {
    await refreshPullRequests(props.state)
  }, [refreshPullRequests, props.state])

  const handleRetry = useCallback(async () => {
    await fetchPullRequests(props.state, true) // Force refresh on retry
  }, [fetchPullRequests, props.state])

  // GitHubアカウント取得
  useEffect(() => {
    ;(async () => {
      const result = await window.api.settings.github.getAccounts()
      if (result.success && result.data) {
        setAccounts(result.data)
      }
    })()
  }, [])

  // エラーメッセージの表示
  useEffect(() => {
    if (error) {
      message.setMessage('error', error)
    }
  }, [error, message])

  useEffect(() => {
    // 初回読み込み（データがない場合のみ）
    if (isInitialLoad) {
      void fetchPullRequests(props.state, false)
      setIsInitialLoad(false)
    }

    // 5分ごとにポーリング
    // GitHub APIのレート制限: 5,000リクエスト/時間
    // 5分間隔であれば、最大12リクエスト/時間となり、レート制限に余裕がある
    const intervalId = setInterval(
      () => {
        void refreshPullRequests(props.state)
      },
      5 * 60 * 1000
    ) // 5分 = 300,000ms

    // クリーンアップ
    return () => {
      clearInterval(intervalId)
    }
  }, [props.state, fetchPullRequests, refreshPullRequests, isInitialLoad])

  // 自分が作成者、assignee、またはreviewerに含まれているPRのみをフィルタリング
  const filteredPullRequests = filterMyPRs
    ? pullRequests.filter((pr) => {
        const myLogins = accounts.map((account) => account.login)
        const isAuthor = myLogins.includes(pr.author.name)
        const isAssignee = pr.assignees.some((assignee) => myLogins.includes(assignee.name))
        const isReviewer = pr.reviewers.some((reviewer) => myLogins.includes(reviewer.name))
        return isAuthor || isAssignee || isReviewer
      })
    : pullRequests

  return (
    <TColumn gap={1}>
      <TRow align="center" justify="space-between">
        <TRow align="center" gap={1}>
          <GitHubIcon />
          <TText>Open Pull Requests</TText>
          {lastFetchedAt && (
            <TText variant="caption">
              (Last updated: {text.formatDateTime(lastFetchedAt) ?? ''})
            </TText>
          )}
        </TRow>
        <TRow>
          <TCheckbox name="filterMyPRs" control={control} label="Only my PRs" />
          <TIconButton onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <TCircularProgress size={24} /> : <IoRefresh size={24} />}
          </TIconButton>
        </TRow>
      </TRow>

      {loading && pullRequests.length === 0 ? (
        <TColumn gap={1} align="center">
          <TCircularProgress size={40} />
          <TText>Loading pull requests...</TText>
        </TColumn>
      ) : error && pullRequests.length === 0 ? (
        <TColumn gap={2} align="center">
          <TAlert severity="error">{error}</TAlert>
          <TButton onClick={handleRetry} variant="contained" disabled={loading}>
            Retry
          </TButton>
        </TColumn>
      ) : filteredPullRequests.length === 0 ? (
        <TAlert severity={'info'}>No pull requests</TAlert>
      ) : (
        <>
          {groupingPullRequests(filteredPullRequests).map((owner) =>
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
