import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface Item {
  id: string
  text: string
  icon?: ReactNode
  selected?: boolean
  hide?: boolean
  href?: string
  onClick?: () => void
}

interface Props {
  items: Item[]
  height?: number | string
}

function TListItem(props: { item: Item }) {
  const item = props.item

  if (item.onClick) {
    return (
      <ListItem disablePadding>
        <ListItemButton onClick={item.onClick} selected={!!item.selected}>
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    )
  }
  if (item.href) {
    return (
      <ListItem disablePadding>
        <ListItemButton to={item.href} selected={!!item.selected} component={Link}>
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    )
  }
  return (
    <ListItem>
      {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
      <ListItemText primary={item.text} />
    </ListItem>
  )
}

export default function TList(props: Props) {
  return (
    <List sx={{ padding: 0, height: props.height, overflowY: props.height ? 'auto' : undefined }}>
      {props.items.map((item) => {
        if (item.hide) {
          return null
        }
        return <TListItem key={item.id} item={item} />
      })}
    </List>
  )
}
