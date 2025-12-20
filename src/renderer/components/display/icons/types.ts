import { useTheme } from '@mui/material/styles'
import type { Color } from '@renderer/types/color'

/**
 * アイコンコンポーネントの共通Props
 */
export interface IconProps {
  /**
   * アイコンのサイズ（ピクセル）
   * @default 24
   */
  size?: number
  /**
   * アイコンの色
   * テーマカラー ('primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success')
   */
  color?: Color
}

/**
 * テーマカラーをCSSカラー文字列に変換するカスタムフック
 */
export function useIconColor(color?: Color): string | undefined {
  const theme = useTheme()

  if (!color) {
    return undefined
  }

  return theme.palette[color].main
}
