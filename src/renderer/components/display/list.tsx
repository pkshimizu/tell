import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import type { ReactNode } from 'react'

interface Item {
  id: string
  text: string
  icon?: ReactNode
  selected?: boolean
  hide?: boolean
  onClick?: () => void
}

interface Props {
  items: Item[]
}

function TListItem(props: { item: Item }) {
  const item = props.item

  if (item.onClick) {
    return (
      <ListItemButton onClick={item.onClick} selected={item.selected}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.text} />
      </ListItemButton>
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
    <List sx={{ padding: 0 }}>
      {props.items.map((item) => {
        if (item.hide) {
          return null
        }
        return <TListItem key={item.id} item={item} />
      })}
    </List>
  )
}
