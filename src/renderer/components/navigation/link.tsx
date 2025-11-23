import { Link } from '@mui/material'
import { type ReactNode } from 'react'

interface Props {
  href: string
  children: ReactNode
}

export default function TLink({ href, children }: Props) {
  return (
    <Link
      component={'a'}
      href={href}
      target={'_blank'}
      sx={{
        color: 'black.main',
        textDecorationColor: 'inherit',
        textDecoration: 'none',
        cursor: 'pointer'
      }}
    >
      {children}
    </Link>
  )
}
