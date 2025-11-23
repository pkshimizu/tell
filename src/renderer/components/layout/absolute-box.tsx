import { Box } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  hidden?: boolean
  children: ReactNode
}

export default function TAbsoluteBox({ top, left, right, bottom, hidden, children }: Props) {
  return (
    <Box
      top={top}
      left={left}
      right={right}
      bottom={bottom}
      position="absolute"
      boxSizing="border-box"
      hidden={hidden}
    >
      {children}
    </Box>
  )
}
