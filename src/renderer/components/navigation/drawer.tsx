import { type ReactNode, useCallback } from 'react'
import { Drawer } from '@mui/material'

type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom'

interface Props {
  anchor?: DrawerAnchor
  open: boolean
  variant: 'permanent' | 'persistent' | 'temporary'
  children: ReactNode
  onClose?: () => void
  width?: string | number
}

export default function TDrawer({
  anchor = 'left',
  open,
  variant,
  children,
  onClose,
  width
}: Props) {
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  return (
    <Drawer
      anchor={anchor}
      open={open}
      variant={variant}
      onClose={handleClose}
      PaperProps={
        width
          ? {
              sx: { width }
            }
          : undefined
      }
    >
      {children}
    </Drawer>
  )
}
