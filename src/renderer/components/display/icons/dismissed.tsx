import { IoCloseCircleOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function DismissedIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoCloseCircleOutline size={size} color={iconColor} />
}
