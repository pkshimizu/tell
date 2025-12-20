import { IoAlertCircleOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function AttentionIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoAlertCircleOutline size={size} color={iconColor} />
}
