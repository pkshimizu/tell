import {
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  IconButton,
  Box,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
      {props.title && (
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{props.title}</Typography>
            <IconButton
              edge="end"
              onClick={props.onClose}
              aria-label="close"
              sx={{ marginRight: -1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
      )}
      <DialogContent>{props.children}</DialogContent>
      {props.actions && <DialogActions>{props.actions}</DialogActions>}
    </Dialog>
  )
}
