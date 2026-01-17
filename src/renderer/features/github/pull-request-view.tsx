import TGrid from '@renderer/components/layout/grid'
import TText from '@renderer/components/display/text'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import CheckIcon from '@renderer/components/display/icons/check'
import TGridItem from '@renderer/components/layout/grid-item'
import TAvatar from '@renderer/components/display/avatar'
import TBox from '@renderer/components/display/box'
import {
  GitHubApiPullRequest,
  GitHubApiPullRequestReviewStatus,
  GitHubApiCheckRun
} from '@renderer/types/github'
import useText from '@renderer/hooks/text'
import TGridContents from '@renderer/components/layout/grid-contents'
import CommentIcon from '@renderer/components/display/icons/comment'
import AttentionIcon from '@renderer/components/display/icons/attention'
import PendingIcon from '@renderer/components/display/icons/pending'
import DismissedIcon from '@renderer/components/display/icons/dismissed'
import QuestionIcon from '@renderer/components/display/icons/question'
import CloseIcon from '@renderer/components/display/icons/close'
import LoadingIcon from '@renderer/components/display/icons/loading'
import TLink from '@renderer/components/navigation/link'
import TBranchArrow from '@renderer/components/display/branch-arrow'

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

function CheckRunStatusIcon({ check }: { check: GitHubApiCheckRun }) {
  if (check.status === 'in_progress' || check.status === 'queued') {
    return <LoadingIcon size={14} color={'info'} />
  }
  if (check.conclusion === 'success') {
    return <CheckIcon size={14} color={'success'} />
  }
  if (check.conclusion === 'failure') {
    return <CloseIcon size={14} color={'error'} />
  }
  if (check.conclusion === 'skipped' || check.conclusion === 'neutral') {
    return <DismissedIcon size={14} />
  }
  return <PendingIcon size={14} color={'warning'} />
}

export default function GitHubPullRequestView({ pullRequest }: Props) {
  const text = useText()
  return (
    <TBox backgroundColor={'boxBackground'} padding={2}>
      <TGrid columns={['1fr', '160px', '240px']} gap={1}>
        <TGridItem align={'center'}>
          <TColumn>
            <TLink href={pullRequest.htmlUrl}>
              <TText>{pullRequest.title}</TText>
            </TLink>
            <TBranchArrow
              sourceBranch={pullRequest.sourceBranch}
              targetBranch={pullRequest.targetBranch}
            />
            {pullRequest.statusChecks && pullRequest.statusChecks.checks.length > 0 && (
              <TRow gap={1} align={'center'}>
                {pullRequest.statusChecks.checks.map((check, index) => (
                  <TRow key={`${check.name}-${index}`} align={'center'} gap={0.5}>
                    <CheckRunStatusIcon check={check} />
                    <TText variant={'caption'}>{check.name}</TText>
                  </TRow>
                ))}
              </TRow>
            )}
            <TRow gap={1}>
              <TText variant={'caption'}>{text.fromNow(pullRequest.createdAt)} created</TText>
              <TText variant={'caption'}>/</TText>
              <TText variant={'caption'}>{text.fromNow(pullRequest.updatedAt)} updated</TText>
            </TRow>
          </TColumn>
        </TGridItem>
        <TColumn gap={1}>
          <TText variant={'caption'}>Created by</TText>
          <TLink href={pullRequest.author.htmlUrl}>
            <TRow align={'center'} gap={1}>
              <TAvatar alt={pullRequest.author.name} url={pullRequest.author.avatarUrl} size={24} />
              <TText>{pullRequest.author.name}</TText>
            </TRow>
          </TLink>
          {pullRequest.assignees.length > 0 && (
            <TColumn gap={1}>
              <TText variant={'caption'}>Assignees</TText>
              {pullRequest.assignees.map((assignee) => (
                <TLink key={assignee.name} href={assignee.htmlUrl}>
                  <TRow align={'center'} gap={1}>
                    <TAvatar alt={assignee.name} url={assignee.avatarUrl} size={24} />
                    <TText>{assignee.name}</TText>
                  </TRow>
                </TLink>
              ))}
            </TColumn>
          )}
        </TColumn>
        <TColumn gap={1}>
          <TText variant={'caption'}>Reviewers</TText>
          <TGrid columns={['1fr', '64px']} rowGap={1}>
            {pullRequest.reviewers
              .filter((reviewer) => reviewer.name !== pullRequest.author.name)
              .map((reviewer) => (
                <TGridContents key={reviewer.name}>
                  <TLink href={reviewer.htmlUrl}>
                    <TRow align={'center'} gap={1}>
                      <TAvatar alt={reviewer.name} url={reviewer.avatarUrl} size={24} />
                      <TText>{reviewer.name}</TText>
                    </TRow>
                  </TLink>
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
