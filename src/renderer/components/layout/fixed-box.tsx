import type { ReactNode } from 'react'
import { Box } from '@mui/material'

interface Props {
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
  zIndex?: number
  children: ReactNode
}

export default function TFixedBox({ top, left, right, bottom, zIndex, children }: Props) {
  return (
    <Box
      top={top}
      left={left}
      right={right}
      bottom={bottom}
      position="fixed"
      boxSizing="border-box"
      zIndex={zIndex}
    >
      {children}
    </Box>
  )
}
