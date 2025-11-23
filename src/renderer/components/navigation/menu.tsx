import { Menu } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  target?: Element
  children?: ReactNode
  onClose?: () => void
}

export default function TMenu(props: Props) {
  return (
    <Menu anchorEl={props.target} open={props.target !== undefined} onClose={props.onClose}>
      {props.children}
    </Menu>
  )
}
