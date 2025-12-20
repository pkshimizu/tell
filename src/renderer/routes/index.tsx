import { createFileRoute } from '@tanstack/react-router'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import GitHubIcon from '@renderer/components/display/icons/github'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import TAvatar from '@renderer/components/display/avatar'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <TColumn gap={1}>
      <TRow align="center" gap={1}>
        <GitHubIcon />
        <TText>Open Pull Requests</TText>
      </TRow>
      <TRow gap={1}>
        <TAvatar
          alt={'user name'}
          url={'https://avatars.githubusercontent.com/u/300403?v=4'}
          size={24}
        />
        <TText>Owner name</TText>
        <TText>/</TText>
        <TText>Repository name</TText>
      </TRow>
      <GitHubPullRequestView />
    </TColumn>
  )
}
