import TAlert from '@renderer/components/feedback/alert'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import { useEffect, useState } from 'react'
import { GitHubApiPullRequest, GitHubOwner, GitHubRepository } from '@renderer/types/github'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import GitHubIcon from '@renderer/components/display/icons/github'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPullRequests = async (): Promise<void> => {
      try {
        setLoading(true)
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
        setLoading(false)
      }
    }

    void fetchPullRequests()
  }, [props.state])

  if (loading) {
    return (
      <TColumn gap={1} align="center">
        <TCircularProgress size={40} />
        <TText>Loading pull requests...</TText>
      </TColumn>
    )
  }

  if (error) {
    return (
      <TColumn gap={1}>
        <TRow align="center" gap={1}>
          <GitHubIcon />
          <TText>Open Pull Requests</TText>
        </TRow>
        <TAlert severity="error">{error}</TAlert>
      </TColumn>
    )
  }

  if (pullRequests.length === 0) {
    return <TAlert severity={'info'}>No pull requests</TAlert>
  }

  return (
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
  )
}
