import { IoLogoGithub } from 'react-icons/io5'
import { type IconProps, useIconColor } from './types'

export default function GitHubIcon({ size = 24, color }: IconProps) {
  const iconColor = useIconColor(color)
  return <IoLogoGithub size={size} color={iconColor} />
}
