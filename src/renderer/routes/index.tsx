import { createFileRoute } from '@tanstack/react-router'
import GitHubPullRequestsPanel from '@renderer/features/github/pull-requests-panel'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function RouteComponent() {
  return <GitHubPullRequestsPanel state={'open'} />
}
