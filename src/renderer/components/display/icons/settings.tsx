import { IoSettingsOutline } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function SettingsIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoSettingsOutline size={size} color={iconColor} />
}
