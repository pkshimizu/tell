import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function CommentIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoChatboxEllipsesOutline size={size} color={iconColor} />
}
