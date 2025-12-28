import { IoBugOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function BugIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoBugOutline size={size} color={iconColor} />
}
