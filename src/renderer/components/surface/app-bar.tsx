import type { ReactNode } from 'react'
import { AppBar, Toolbar } from '@mui/material'
import type { ThemeColor } from '@renderer/types/color'

interface Props {
  color?: ThemeColor
  position?: 'fixed' | 'static'
  children: ReactNode
}

export default function TAppBar({ color = 'secondary', position = 'fixed', children }: Props) {
  return (
    <AppBar position={position} elevation={1} color={color}>
      <Toolbar variant="dense" disableGutters>
        {children}
      </Toolbar>
    </AppBar>
  )
}
