import { Button } from '@mui/material'
import { type ReactNode, useCallback } from 'react'
import { type ThemeColor } from '@renderer/types/color'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import { TRow } from '@renderer/components/layout/flex-box'

interface Props {
  variant?: 'contained' | 'outlined' | 'text'
  onClick?: () => void
  loading?: boolean
  width?: number
  height?: number
  color?: ThemeColor
  fullWidth?: boolean
  fullHeight?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
  disabled?: boolean
  processing?: boolean
  children: ReactNode
}

export default function TButton({
  variant,
  onClick,
  loading,
  width,
  height,
  color,
  fullWidth,
  fullHeight,
  type,
  href,
  disabled,
  processing,
  children
}: Props) {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
    if (href) {
      window.location.href = href
    }
  }, [onClick, href])

  return (
    <Button
      variant={variant}
      loading={loading}
      onClick={handleClick}
      color={color}
      type={type}
      disabled={disabled}
      sx={{
        ...(width && { width: width }),
        ...(height && { height: height }),
        ...(fullWidth && { width: '100%' }),
        ...(fullHeight && { height: '100%' })
      }}
    >
      <TRow>
        {processing && <TCircularProgress size={24} />}
        {children}
      </TRow>
    </Button>
  )
}
