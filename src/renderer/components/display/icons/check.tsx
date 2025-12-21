import { IoCheckmarkCircleOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function CheckIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoCheckmarkCircleOutline size={size} color={iconColor} />
}
