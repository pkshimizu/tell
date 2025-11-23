import { Dialog, DialogActions, DialogContent, type DialogProps, DialogTitle } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  title?: string
  size?: DialogProps['maxWidth']
  children: ReactNode
  actions?: ReactNode
  onSubmit?: () => void
  onClose: () => void
}

export default function TDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      fullWidth
      maxWidth={props.size}
      onClose={props.onClose}
      component={props.onSubmit ? 'form' : undefined}
      onSubmit={props.onSubmit}
    >
      {props.title && <DialogTitle>{props.title}</DialogTitle>}
      <DialogContent>{props.children}</DialogContent>
      {props.actions && <DialogActions>{props.actions}</DialogActions>}
    </Dialog>
  )
}
