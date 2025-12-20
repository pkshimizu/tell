import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import type { Color } from '@renderer/types/color'

interface TBoxProps {
  /**
   * 子要素
   */
  children?: ReactNode
  /**
   * 背景色
   */
  backgroundColor?: Color
  /**
   * ボーダーの色
   */
  borderColor?: Color
  /**
   * ボーダーの太さ（ピクセル）
   * @default 1
   */
  borderWidth?: number
  /**
   * ボーダーのスタイル
   * @default 'solid'
   */
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none'
  /**
   * パディング（ピクセルまたはテーマのスペーシング単位）
   */
  padding?: number
  /**
   * マージン（ピクセルまたはテーマのスペーシング単位）
   */
  margin?: number
  /**
   * ボーダーの角丸（ピクセル）
   */
  borderRadius?: number
  /**
   * 幅
   */
  width?: number
  /**
   * 高さ
   */
  height?: number
}

export default function TBox({
  children,
  backgroundColor,
  borderColor,
  borderWidth = 1,
  borderStyle = 'solid',
  padding,
  margin,
  borderRadius,
  width,
  height
}: TBoxProps) {
  const theme = useTheme()

  const bgColor = backgroundColor ? theme.palette[backgroundColor].main : undefined
  const bColor = borderColor ? theme.palette[borderColor].main : undefined

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        border: bColor ? `${borderWidth}px ${borderStyle} ${bColor}` : undefined,
        padding,
        margin,
        borderRadius,
        width,
        height
      }}
    >
      {children}
    </Box>
  )
}
