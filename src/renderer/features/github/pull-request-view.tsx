import TGrid from '@renderer/components/layout/grid'
import TText from '@renderer/components/display/text'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import CheckIcon from '@renderer/components/display/icons/check'
import TGridItem from '@renderer/components/layout/grid-item'
import TAvatar from '@renderer/components/display/avatar'
import TBox from '@renderer/components/display/box'
import { GitHubApiPullRequest, GitHubApiPullRequestReviewStatus } from '@renderer/types/github'
import useText from '@renderer/hooks/text'
import TGridContents from '@renderer/components/layout/grid-contents'

type Props = {
  pullRequest: GitHubApiPullRequest
}

function reviewStatusColor(status: GitHubApiPullRequestReviewStatus) {
  if (status === 'approved') {
    return 'success'
  }
  if (status === 'commented') {
    return undefined
  }
  return undefined
}

export default function GitHubPullRequestView({ pullRequest }: Props) {
  const text = useText()
  return (
    <TBox backgroundColor={'boxBackground'} padding={2}>
      <TGrid columns={['1fr', '160px', '240px']}>
        <TGridItem align={'center'}>
          <TColumn>
            <TText>{pullRequest.title}</TText>
            <TRow gap={1}>
              <TText variant={'caption'}>{text.fromNow(pullRequest.createdAt)} created</TText>
              <TText variant={'caption'}>/</TText>
              <TText variant={'caption'}>{text.fromNow(pullRequest.updatedAt)} updated</TText>
            </TRow>
          </TColumn>
        </TGridItem>
        <TColumn>
          <TText variant={'caption'}>Assignees</TText>
          {pullRequest.assignees.map((assignee) => (
            <TRow key={assignee.name} align={'center'} gap={1}>
              <TAvatar alt={assignee.name} url={assignee.avatarUrl} size={24} />
              <TText>{assignee.name}</TText>
            </TRow>
          ))}
        </TColumn>
        <TColumn>
          <TText variant={'caption'}>Reviewers</TText>
          <TGrid columns={['1fr', '64px']}>
            {pullRequest.reviewers.map((reviewer) => (
              <TGridContents key={reviewer.name}>
                <TRow align={'center'} gap={1}>
                  <TAvatar alt={reviewer.name} url={reviewer.avatarUrl} size={24} />
                  <TText>{reviewer.name}</TText>
                </TRow>
                <TRow align={'center'} gap={1}>
                  <CheckIcon color={reviewStatusColor(reviewer.status)} />
                  <TText>{reviewer.comments}</TText>
                </TRow>
              </TGridContents>
            ))}
          </TGrid>
        </TColumn>
      </TGrid>
    </TBox>
  )
}
