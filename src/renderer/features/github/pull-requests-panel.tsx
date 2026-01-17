import TAlert from '@renderer/components/feedback/alert'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GitHubAccount,
  GitHubApiPullRequest,
  GitHubOwner,
  GitHubRepository
} from '@renderer/types/github'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import TLinearProgress from '@renderer/components/feedback/linear-progress'
import GitHubIcon from '@renderer/components/display/icons/github'
import TIconButton from '@renderer/components/form/icon-button'
import { IoRefresh } from 'react-icons/io5'
import useMessage from '@renderer/hooks/message'
import usePullRequests from '@renderer/hooks/pull-requests'
import TCheckbox from '@renderer/components/form/checkbox'
import TSelect from '@renderer/components/form/select'
import { useForm } from 'react-hook-form'
import useText from '@renderer/hooks/text'

const AUTO_RELOAD_INTERVAL_SECONDS = 5 * 60 // 5分

type Props = {
  state: 'open' | 'closed'
}

type SortKey = 'createdAt' | 'updatedAt' | 'author'
type SortOrder = 'asc' | 'desc'

type FilterFormData = {
  filterMyPRs: boolean
  sortBy: SortKey
  sortOrder: SortOrder
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

function sortPullRequests(
  pullRequests: GitHubApiPullRequest[],
  sortBy: SortKey,
  sortOrder: SortOrder
): GitHubApiPullRequest[] {
  return [...pullRequests].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case 'author':
        comparison = a.author.name.localeCompare(b.author.name)
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedSecondsRef = useRef(0)

  const { control, watch, setValue } = useForm<FilterFormData>({
    defaultValues: {
      filterMyPRs: true,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }
  })

  const filterMyPRs = watch('filterMyPRs')
  const sortBy = watch('sortBy')
  const sortOrder = watch('sortOrder')
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  const sortKeyItems = [
    { value: 'createdAt', label: 'Created' },
    { value: 'updatedAt', label: 'Updated' },
    { value: 'author', label: 'Author' }
  ]

  const sortOrderItems = [
    { value: 'desc', label: 'Desc' },
    { value: 'asc', label: 'Asc' }
  ]

  const resetTimer = useCallback(() => {
    elapsedSecondsRef.current = 0
    setElapsedSeconds(0)
  }, [])

  const handleRefresh = useCallback(async () => {
    await refreshPullRequests(props.state)
    resetTimer()
    if (error) {
      message.setMessage('error', error)
    }
  }, [refreshPullRequests, props.state, error, message, resetTimer])

  // GitHubアカウント取得
  useEffect(() => {
    ;(async () => {
      const result = await window.api.settings.github.getAccounts()
      if (result.success && result.data) {
        setAccounts(result.data)
      }
    })()
  }, [])

  // ソート設定の読み込み
  useEffect(() => {
    ;(async () => {
      const result = await window.api.settings.pullRequests.get()
      if (result.success && result.data) {
        setValue('sortBy', result.data.sortBy)
        setValue('sortOrder', result.data.sortOrder)
      }
      setIsSettingsLoaded(true)
    })()
  }, [setValue])

  // ソート設定の保存
  useEffect(() => {
    if (!isSettingsLoaded) return
    ;(async () => {
      await window.api.settings.pullRequests.set(sortBy, sortOrder)
    })()
  }, [sortBy, sortOrder, isSettingsLoaded])

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

    // 1秒ごとにプログレスバーを更新し、5分経過で自動リロード
    const intervalId = setInterval(() => {
      elapsedSecondsRef.current += 1
      setElapsedSeconds(elapsedSecondsRef.current)

      if (elapsedSecondsRef.current >= AUTO_RELOAD_INTERVAL_SECONDS) {
        void refreshPullRequests(props.state)
        elapsedSecondsRef.current = 0
        setElapsedSeconds(0)
      }
    }, 1000)

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

  // ソート処理
  const sortedPullRequests = sortPullRequests(filteredPullRequests, sortBy, sortOrder)

  return (
    <TColumn gap={1}>
      <TRow align="center" justify="space-between">
        <TRow align="center" gap={1}>
          <GitHubIcon />
          <TText>Open Pull Requests</TText>
          {lastFetchedAt && (
            <TText variant="caption">(Last updated: {text.fromNow(lastFetchedAt) ?? ''})</TText>
          )}
        </TRow>
        <TRow align="center" gap={2}>
          <TCheckbox name="filterMyPRs" control={control} label="Only my PRs" />
          <TRow align="center" gap={1}>
            <TSelect name="sortBy" control={control} items={sortKeyItems} />
            <TSelect name="sortOrder" control={control} items={sortOrderItems} />
          </TRow>
          <TColumn align="center">
            <TIconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <TCircularProgress size={24} /> : <IoRefresh size={24} />}
            </TIconButton>
            <TLinearProgress
              value={100 - (elapsedSeconds / AUTO_RELOAD_INTERVAL_SECONDS) * 100}
              width={40}
              height={3}
            />
          </TColumn>
        </TRow>
      </TRow>

      {loading && pullRequests.length === 0 ? (
        <TColumn gap={1} align="center">
          <TCircularProgress size={40} />
          <TText>Loading pull requests...</TText>
        </TColumn>
      ) : sortedPullRequests.length === 0 ? (
        <TAlert severity={'info'}>No pull requests</TAlert>
      ) : (
        <>
          {groupingPullRequests(sortedPullRequests).map((owner) =>
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
