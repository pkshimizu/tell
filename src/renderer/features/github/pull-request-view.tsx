import TGrid from '@renderer/components/layout/grid'
import TText from '@renderer/components/display/text'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import CheckIcon from '@renderer/components/display/icons/check'
import TGridItem from '@renderer/components/layout/grid-item'
import CommentIcon from '@renderer/components/display/icons/comment'
import AttentionIcon from '@renderer/components/display/icons/attention'
import TAvatar from '@renderer/components/display/avatar'

export default function GitHubPullRequestView() {
  return (
    <TGrid columns={['1fr', '160px', '240px']}>
      <TGridItem align={'center'}>
        <TColumn>
          <TText>Pull request title</TText>
          <TRow gap={1}>
            <TText variant={'caption'}>1 days ago created</TText>
            <TText variant={'caption'}>/</TText>
            <TText variant={'caption'}>1 days ago updated</TText>
          </TRow>
        </TColumn>
      </TGridItem>
      <TColumn>
        <TText variant={'caption'}>Assignees</TText>
        <TRow align={'center'} gap={1}>
          <TAvatar
            alt={'user name'}
            url={'https://avatars.githubusercontent.com/u/300403?v=4'}
            size={24}
          />
          <TText>Assignee user name</TText>
        </TRow>
      </TColumn>
      <TColumn>
        <TText variant={'caption'}>Reviewers</TText>
        <TGrid columns={['1fr', '64px']}>
          <TRow align={'center'} gap={1}>
            <TAvatar
              alt={'user name'}
              url={'https://avatars.githubusercontent.com/u/300403?v=4'}
              size={24}
            />
            <TText>Reviewer user1 name</TText>
          </TRow>
          <TRow align={'center'} gap={1}>
            <CheckIcon color={'success'} />
            <TText>10</TText>
          </TRow>
          <TRow align={'center'} gap={1}>
            <TAvatar
              alt={'user name'}
              url={'https://avatars.githubusercontent.com/u/300403?v=4'}
              size={24}
            />
            <TText>Reviewer user2 name</TText>
          </TRow>
          <TRow align={'center'} gap={1}>
            <CommentIcon />
            <TText>10</TText>
          </TRow>
          <TRow align={'center'} gap={1}>
            <TAvatar
              alt={'user name'}
              url={'https://avatars.githubusercontent.com/u/300403?v=4'}
              size={24}
            />
            <TText>Reviewer user3 name</TText>
          </TRow>
          <TRow align={'center'} gap={1}>
            <AttentionIcon color={'warning'} />
            <TText>10</TText>
          </TRow>
        </TGrid>
      </TColumn>
    </TGrid>
  )
}
