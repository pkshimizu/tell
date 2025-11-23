import CircularProgress from '@mui/material/CircularProgress'

interface Props {
  size: number
}

export default function TCircularProgress({ size }: Props) {
  return <CircularProgress size={`${size}px`} />
}
