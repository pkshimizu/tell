import { createFileRoute } from '@tanstack/react-router'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import GitHubIcon from '@renderer/components/display/icons/github'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <TColumn>
      <TRow align="center" gap={1}>
        <GitHubIcon />
        <TText>Open Pull Requests</TText>
      </TRow>
      <GitHubPullRequestView />
    </TColumn>
  )
}
