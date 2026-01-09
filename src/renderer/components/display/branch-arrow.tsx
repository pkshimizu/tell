import TText from '@renderer/components/display/text'
import TTooltip from '@renderer/components/feedback/tooltip'
import TGrid from '@renderer/components/layout/grid'
import ArrowForwardIcon from '@renderer/components/display/icons/arrow-forward'

interface Props {
  sourceBranch: string
  targetBranch: string
}

export default function TBranchArrow({ sourceBranch, targetBranch }: Props) {
  return (
    <TGrid columns={['1fr', '16px', '1fr']} columnGap={1} alignItems="center">
      <TTooltip title={sourceBranch}>
        <TText variant="caption" bold whiteSpace="nowrap" overflow="hidden">
          {sourceBranch}
        </TText>
      </TTooltip>

      <ArrowForwardIcon size={16} />

      <TTooltip title={targetBranch}>
        <TText variant="caption" bold whiteSpace="nowrap" overflow="hidden">
          {targetBranch}
        </TText>
      </TTooltip>
    </TGrid>
  )
}
