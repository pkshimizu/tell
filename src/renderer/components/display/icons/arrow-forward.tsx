import { type IconProps, useIconColor } from './types'
import { IoArrowForward } from 'react-icons/io5'

export default function ArrowForwardIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoArrowForward size={size} color={iconColor} />
}
