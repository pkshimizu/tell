import { IoHelpCircleOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function QuestionIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoHelpCircleOutline size={size} color={iconColor} />
}
