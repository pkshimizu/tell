import { IoHomeOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function HomeIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoHomeOutline size={size} color={iconColor} />
}
