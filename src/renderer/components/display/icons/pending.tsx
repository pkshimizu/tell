import { IoEllipsisHorizontalCircleOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function PendingIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoEllipsisHorizontalCircleOutline size={size} color={iconColor} />
}
