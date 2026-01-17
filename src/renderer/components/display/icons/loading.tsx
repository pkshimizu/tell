import { IoSyncOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'
import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const SpinningIcon = styled(IoSyncOutline)`
  animation: ${spin} 1s linear infinite;
`

export default function LoadingIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <SpinningIcon size={size} color={iconColor} />
}
