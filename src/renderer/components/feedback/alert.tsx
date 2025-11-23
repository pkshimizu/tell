import type { ReactNode } from 'react'
import { Alert, AlertTitle, type AlertColor } from '@mui/material'

type Severity = AlertColor
type Variant = 'filled' | 'outlined' | 'standard'

interface Props {
  icon?: boolean
  severity: Severity
  title?: string
  variant?: Variant
  children?: ReactNode
}

export default function TAlert({ icon, severity, title, variant, children }: Props) {
  return (
    <Alert severity={severity} variant={variant} icon={icon}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </Alert>
  )
}
