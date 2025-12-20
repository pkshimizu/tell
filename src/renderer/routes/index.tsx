import { createFileRoute } from '@tanstack/react-router'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import GitHubIcon from '@renderer/components/display/icons/github'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import TAvatar from '@renderer/components/display/avatar'
import { useState } from 'react'
import { GitHubApiPullRequest, GitHubOwner, GitHubRepository } from '@renderer/types/github'
import TAlert from '@renderer/components/feedback/alert'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

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
  return owners.values().toArray()
}

function RouteComponent() {
  const [pullRequests] = useState<GitHubApiPullRequest[]>([])

  return (
    <TColumn gap={1}>
      <TRow align="center" gap={1}>
        <GitHubIcon />
        <TText>Open Pull Requests</TText>
      </TRow>
      {pullRequests.length === 0 && <TAlert severity={'success'}>No pull requests</TAlert>}
      {groupingPullRequests(pullRequests).map((owner) =>
        owner.repositories.values().map((repository) => (
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
    </TColumn>
  )
}
