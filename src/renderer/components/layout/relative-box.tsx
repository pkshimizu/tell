import type { ReactNode } from 'react'
import { Box } from '@mui/material'

interface Props {
  width?: string
  height?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: ReactNode
}

export default function TRelativeBox({
  width = '100%',
  height = '100%',
  onMouseEnter,
  onMouseLeave,
  children
}: Props) {
  return (
    <Box
      width={width}
      height={height}
      position="relative"
      boxSizing="border-box"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Box>
  )
}
