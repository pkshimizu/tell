import type { ReactNode } from 'react'
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material'

interface Props {
  icon?: ReactNode
  label: string
  onClick?: () => void
}

export default function TMenuItem(props: Props) {
  return (
    <MenuItem onClick={props.onClick}>
      {props.icon && <ListItemIcon>{props.icon}</ListItemIcon>}
      <ListItemText>{props.label}</ListItemText>
    </MenuItem>
  )
}
