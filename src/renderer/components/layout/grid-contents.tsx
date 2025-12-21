import { ReactNode } from 'react'
import { Box } from '@mui/material'

type Props = {
  children: ReactNode
}

export default function TGridContents(props: Props) {
  return <Box sx={{ display: 'contents' }}>{props.children}</Box>
}
