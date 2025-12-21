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
import CommentIcon from '@renderer/components/display/icons/comment'
import AttentionIcon from '@renderer/components/display/icons/attention'
import PendingIcon from '@renderer/components/display/icons/pending'
import DismissedIcon from '@renderer/components/display/icons/dismissed'
import QuestionIcon from '@renderer/components/display/icons/question'

type Props = {
  pullRequest: GitHubApiPullRequest
}

function ReviewStatusIcon({ status }: { status: GitHubApiPullRequestReviewStatus }) {
  if (status === 'approved') {
    return <CheckIcon color={'success'} />
  }
  if (status === 'commented') {
    return <CommentIcon />
  }
  if (status === 'changes_requested') {
    return <AttentionIcon color={'warning'} />
  }
  if (status === 'pending') {
    return <PendingIcon />
  }
  if (status === 'dismissed') {
    return <DismissedIcon />
  }
  return <QuestionIcon />
}

export default function GitHubPullRequestView({ pullRequest }: Props) {
  const text = useText()
  return (
    <TBox backgroundColor={'boxBackground'} padding={2}>
      <TGrid columns={['1fr', '160px', '240px']} gap={1}>
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
        <TColumn gap={1}>
          <TText variant={'caption'}>Reviewers</TText>
          <TGrid columns={['1fr', '64px']}>
            {pullRequest.reviewers.map((reviewer) => (
              <TGridContents key={reviewer.name}>
                <TRow align={'center'} gap={1}>
                  <TAvatar alt={reviewer.name} url={reviewer.avatarUrl} size={24} />
                  <TText>{reviewer.name}</TText>
                </TRow>
                <TRow align={'center'} gap={1}>
                  <ReviewStatusIcon status={reviewer.status} />
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
