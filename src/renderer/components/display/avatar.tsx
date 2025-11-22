import { Avatar } from '@mui/material'

interface Props {
  url?: string
  alt: string
  size?: number
}

export default function MAvatar({ url, alt, size }: Props) {
  return <Avatar src={url} alt={alt} sx={{ width: size, height: size }} />
}
