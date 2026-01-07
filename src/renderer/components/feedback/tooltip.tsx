import { Tooltip } from '@mui/material'
import { ReactElement, ReactNode } from 'react'

interface Props {
  title: ReactNode
  placement?:
    | 'bottom'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom-end'
    | 'bottom-start'
    | 'left-end'
    | 'left-start'
    | 'right-end'
    | 'right-start'
    | 'top-end'
    | 'top-start'
  children: ReactElement
}

export default function TTooltip({ title, placement = 'top', children }: Props) {
  return (
    <Tooltip title={title} placement={placement} arrow>
      {children}
    </Tooltip>
  )
}
