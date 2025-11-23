import { Box } from '@mui/material'
import React from 'react'

interface Props {
  columns?: string[]
  rows?: string[]
  gap?: number
  rowGap?: number
  columnGap?: number
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
  alignItems?: 'start' | 'end' | 'center' | 'stretch'
  justifyContent?:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-around'
    | 'space-between'
    | 'space-evenly'
  alignContent?:
    | 'start'
    | 'end'
    | 'center'
    | 'stretch'
    | 'space-around'
    | 'space-between'
    | 'space-evenly'
  children: React.ReactNode
}

export default function TGrid(props: Props) {
  const gridStyles = {
    display: 'grid',
    ...(props.columns && {
      gridTemplateColumns: props.columns.join(' ')
    }),
    ...(props.rows && {
      gridTemplateRows: props.rows.join(' ')
    }),
    ...(props.gap !== undefined && { gap: props.gap }),
    ...(props.rowGap !== undefined && { rowGap: props.rowGap }),
    ...(props.columnGap !== undefined && { columnGap: props.columnGap }),
    ...(props.justifyItems && { justifyItems: props.justifyItems }),
    ...(props.alignItems && { alignItems: props.alignItems }),
    ...(props.justifyContent && { justifyContent: props.justifyContent }),
    ...(props.alignContent && { alignContent: props.alignContent })
  }

  return <Box sx={{ ...gridStyles }}>{props.children}</Box>
}
