import { Box } from '@mui/material'
import GitHubPullRequestView from '@renderer/features/github/pull-request-view'
import type { PullRequestTreeNode } from '@renderer/features/github/pull-request-tree'

type Props = {
  nodes: PullRequestTreeNode[]
}

type NodeProps = {
  node: PullRequestTreeNode
  depth: number
}

const MAX_INDENT_DEPTH = 5

function PullRequestTreeItem({ node, depth }: NodeProps) {
  const shouldIndentChildren = depth < MAX_INDENT_DEPTH

  return (
    <Box component="li">
      <GitHubPullRequestView pullRequest={node.pullRequest} />
      {node.children.length > 0 && (
        <Box
          component="ul"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            m: 0,
            p: 0,
            mt: 1,
            ml: shouldIndentChildren ? 2 : 0,
            pl: shouldIndentChildren ? 2 : 0,
            borderLeft: shouldIndentChildren ? 1 : 0,
            borderColor: 'divider',
            listStyle: 'none'
          }}
        >
          {node.children.map((child) => (
            <PullRequestTreeItem key={child.pullRequest.id} node={child} depth={depth + 1} />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function PullRequestTreeView({ nodes }: Props) {
  return (
    <Box
      component="ul"
      aria-label="Pull request stack"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0, m: 0, listStyle: 'none' }}
    >
      {nodes.map((node) => (
        <PullRequestTreeItem key={node.pullRequest.id} node={node} depth={0} />
      ))}
    </Box>
  )
}
