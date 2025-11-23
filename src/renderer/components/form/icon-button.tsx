import { IconButton } from '@mui/material'
import { type ReactNode, type MouseEvent } from 'react'
import { type ThemeColor } from '@renderer/types/color'

interface Props {
  color?: ThemeColor
  children: ReactNode
  loading?: boolean
  onClick?: (element: Element) => void
}

export default function TIconButton(props: Props) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(event?.target as Element)
    }
  }

  return (
    <IconButton color={props.color} onClick={handleClick} loading={props.loading}>
      {props.children}
    </IconButton>
  )
}
