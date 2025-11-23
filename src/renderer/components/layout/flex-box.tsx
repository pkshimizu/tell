import { Box } from '@mui/material'
import React from 'react'

interface Props {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  grow?: number
  shrink?: number
  basis?: number | string
  flex?: string | number
  overflow?: 'hidden' | 'visible' | 'scroll' | 'auto'
  width?: number | string
  fullWidth?: boolean
  height?: number | string
  fullHeight?: boolean
  ma?: number
  mx?: number
  ml?: number
  mr?: number
  my?: number
  mt?: number
  mb?: number
  pa?: number
  px?: number
  py?: number
  pl?: number
  pr?: number
  pt?: number
  pb?: number
  children: React.ReactNode
}

export default function TFlexBox({
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  alignContent,
  wrap = 'nowrap',
  gap,
  rowGap,
  columnGap,
  grow,
  shrink,
  basis,
  flex,
  overflow,
  width,
  fullWidth,
  height,
  fullHeight,
  ma,
  mx = ma,
  my = ma,
  mt = my,
  mb = my,
  ml = mx,
  mr = mx,
  pa,
  px = pa,
  py = pa,
  pt = py,
  pb = py,
  pl = px,
  pr = px,
  children
}: Props) {
  const flexStyles = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    ...(alignContent && { alignContent }),
    flexWrap: wrap,
    ...(gap !== undefined && { gap }),
    ...(rowGap !== undefined && { rowGap }),
    ...(columnGap !== undefined && { columnGap }),
    ...(grow !== undefined && { flexGrow: grow }),
    ...(shrink !== undefined && { flexShrink: shrink }),
    ...(basis !== undefined && { flexBasis: basis }),
    ...(flex !== undefined && { flex }),
    ...(overflow !== undefined && { overflow }),
    ...(width !== undefined && { width }),
    ...(fullWidth && { width: '100%' }),
    ...(height !== undefined && { height }),
    ...(fullHeight && { height: '100%' }),
    mt,
    mb,
    ml,
    mr,
    pt,
    pb,
    pl,
    pr
  }

  return <Box sx={{ ...flexStyles }}>{children}</Box>
}

export function TRow(props: Omit<Props, 'direction'>) {
  return <TFlexBox direction="row" {...props} />
}

export function TColumn(props: Omit<Props, 'direction'>) {
  return <TFlexBox direction="column" {...props} />
}

export function TCenter(props: Omit<Props, 'justify' | 'align'>) {
  return <TFlexBox justify="center" align="center" {...props} />
}
