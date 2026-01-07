import TText from '@renderer/components/display/text'
import { TRow } from '@renderer/components/layout/flex-box'
import TTooltip from '@renderer/components/feedback/tooltip'
import { Box } from '@mui/material'

interface Props {
  sourceBranch: string
  targetBranch: string
}

export default function TBranchArrow({ sourceBranch, targetBranch }: Props) {
  return (
    <TRow gap={1} align="center">
      <TTooltip title={sourceBranch}>
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>
          <TText variant="caption" bold whiteSpace="nowrap" overflow="hidden">
            {sourceBranch}
          </TText>
        </Box>
      </TTooltip>

      <TText variant="caption">→</TText>

      <TTooltip title={targetBranch}>
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>
          <TText variant="caption" bold whiteSpace="nowrap" overflow="hidden">
            {targetBranch}
          </TText>
        </Box>
      </TTooltip>
    </TRow>
  )
}
