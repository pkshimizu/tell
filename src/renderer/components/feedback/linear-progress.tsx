import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'

interface Props {
  value: number
  width?: number
  height?: number
}

export default function TLinearProgress({ value, width = 40, height = 3 }: Props) {
  return (
    <Box sx={{ width, height }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height,
          borderRadius: height / 2
        }}
      />
    </Box>
  )
}
