import type { ReactNode } from 'react'
import { Card, CardActionArea, CardActions, CardContent, CardHeader } from '@mui/material'

interface Props {
  header?: ReactNode
  children: ReactNode
  actions?: ReactNode
  onClick?: () => void
  onClickHeader?: () => void
}

function TCardHeader(props: { children: ReactNode; onClick?: () => void }) {
  const { children, onClick } = props
  if (onClick) {
    return (
      <CardActionArea onClick={onClick}>
        <CardHeader title={children} />
      </CardActionArea>
    )
  }
  return <CardHeader title={children} />
}

function TCardContent(props: { children: ReactNode; onClick?: () => void }) {
  const { children, onClick } = props
  if (onClick) {
    return (
      <CardActionArea onClick={onClick}>
        <CardContent>{children}</CardContent>
      </CardActionArea>
    )
  }
  return <CardContent>{children}</CardContent>
}

export default function TCard({ header, children, actions, onClick, onClickHeader }: Props) {
  return (
    <Card
      variant={'outlined'}
      sx={{
        width: '100%',
        borderRadius: 4
      }}
    >
      {header && <TCardHeader onClick={onClickHeader}>{header}</TCardHeader>}
      <TCardContent onClick={onClick}>{children}</TCardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  )
}
