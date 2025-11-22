import Chip from '@mui/material/Chip'
import type { ThemeColor } from '@renderer/types/color.ts'

interface Props {
  label: string
  size?: 'small'
  variant?: 'outlined' | 'filled'
  color?: ThemeColor
}

export default function TChip(props: Props) {
  return <Chip label={props.label} color={props.color} size={props.size} variant={props.variant} />
}
