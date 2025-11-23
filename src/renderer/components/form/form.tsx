import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onSubmit: () => void
}

export default function TForm({ children, onSubmit }: Props) {
  return <form onSubmit={onSubmit}>{children}</form>
}
