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
    <TRow gap={1} align="center" fullWidth overflow="hidden">
      <TTooltip title={sourceBranch}>
        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <TText variant="caption" bold>
            {sourceBranch}
          </TText>
        </Box>
      </TTooltip>

      <Box sx={{ flexShrink: 0 }}>
        <TText variant="caption">→</TText>
      </Box>

      <TTooltip title={targetBranch}>
        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <TText variant="caption" bold>
            {targetBranch}
          </TText>
        </Box>
      </TTooltip>
    </TRow>
  )
}
