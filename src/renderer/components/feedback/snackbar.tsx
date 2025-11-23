import { Alert, type AlertColor, Snackbar, type SnackbarCloseReason } from '@mui/material'
import * as React from 'react'

export type Severity = AlertColor

interface Props {
  open: boolean
  message: string
  severity: Severity
  onClose: () => void
}

export default function TSnackbar({ open, message, severity, onClose }: Props) {
  const handleClose = (_: React.SyntheticEvent | Event, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return
    }
    onClose()
  }
  return (
    <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
      <Alert severity={severity} variant="filled" onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  )
}
