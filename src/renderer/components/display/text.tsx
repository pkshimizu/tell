import { Typography } from '@mui/material'
import { type ThemeColor, toBgColor } from '@/types/color.ts'

type Text = string | number | Text[]
type Variant = 'caption' | 'body' | 'subtitle' | 'title' | 'headline'

interface Props {
  align?: 'center' | 'start' | 'end'
  color?: ThemeColor
  bold?: boolean
  variant?: Variant
  size?: 'small' | 'medium' | 'large'
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  overflow?: 'hidden' | 'visible' | 'scroll' | 'auto'
  fullWidth?: boolean
  fullHeight?: boolean
  children: Text
}

function typographyVariant(variant?: Variant) {
  if (variant === 'caption') {
    return 'caption'
  }
  if (variant === 'body') {
    return 'body1'
  }
  if (variant === 'subtitle') {
    return 'subtitle1'
  }
  if (variant === 'title') {
    return 'h5'
  }
  if (variant === 'headline') {
    return 'h4'
  }
  return undefined
}

export default function MText(props: Props) {
  return (
    <Typography
      variant={typographyVariant(props.variant)}
      sx={{
        textAlign: props.align,
        color: toBgColor(props.color),
        fontSize: props.size,
        fontWeight: props.bold ? 'bold' : 'normal',
        whiteSpace: props.whiteSpace,
        overflow: props.overflow,
        textOverflow: 'ellipsis',
        width: props.fullWidth ? '100%' : undefined,
        height: props.fullHeight ? '100%' : undefined,
      }}
    >
      {props.children}
    </Typography>
  )
}

export function MMultiLineText(
  props: Omit<Props, 'whiteSpace' | 'overflow' | 'fullWidth' | 'fullHeight'>
) {
  return (
    <MText
      {...props}
      whiteSpace="pre-wrap"
      overflow="auto"
      fullWidth
      fullHeight
    />
  )
}
