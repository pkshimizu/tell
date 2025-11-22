import { Avatar } from '@mui/material'

interface Props {
  url?: string
  alt: string
  size?: number
}

export default function TAvatar({ url, alt, size }: Props) {
  return <Avatar src={url} alt={alt} sx={{ width: size, height: size }} />
}
