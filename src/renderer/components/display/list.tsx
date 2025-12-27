import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface Item {
  id: string
  content?: ReactNode
  icon?: ReactNode
  selected?: boolean
  hide?: boolean
  href?: string
  onClick?: () => void
  tooltip?: string
}

interface Props {
  items: Item[]
  height?: number | string
}

function TListItem(props: { item: Item }) {
  const item = props.item

  const renderContent = (children: ReactNode) => {
    if (item.tooltip) {
      return (
        <Tooltip title={item.tooltip} placement="right" arrow>
          <div style={{ display: 'flex', width: '100%' }}>{children}</div>
        </Tooltip>
      )
    }
    return <>{children}</>
  }

  if (item.onClick) {
    return (
      <ListItem disablePadding>
        {renderContent(
          <ListItemButton onClick={item.onClick} selected={!!item.selected}>
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            {item.content && <ListItemText primary={item.content} />}
          </ListItemButton>
        )}
      </ListItem>
    )
  }
  if (item.href) {
    return (
      <ListItem disablePadding>
        {renderContent(
          <ListItemButton to={item.href} selected={!!item.selected} component={Link}>
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            {item.content && <ListItemText primary={item.content} />}
          </ListItemButton>
        )}
      </ListItem>
    )
  }
  return (
    <ListItem>
      {renderContent(
        <>
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          {item.content && <ListItemText primary={item.content} />}
        </>
      )}
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
