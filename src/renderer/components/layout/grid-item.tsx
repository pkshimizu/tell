import { Box } from '@mui/material'
import { type ReactNode } from 'react'

interface Area {
  top: number
  left: number
  bottom: number
  right: number
}

interface Props {
  align?: 'start' | 'end' | 'center' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'stretch'
  area?: Area
  children: ReactNode
}

export default function TGridItem(props: Props) {
  const area = props.area
  const gridArea = area ? `${area.top} / ${area.left} / ${area.bottom} / ${area.right}` : undefined
  return (
    <Box
      sx={{
        alignSelf: props.align,
        justifySelf: props.justify,
        gridArea
      }}
    >
      {props.children}
    </Box>
  )
}
