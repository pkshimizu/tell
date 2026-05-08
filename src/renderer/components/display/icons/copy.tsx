import { IoCopyOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function CopyIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoCopyOutline size={size} color={iconColor} />
}
