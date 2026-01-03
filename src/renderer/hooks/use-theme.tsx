import { useContext } from 'react'
import { ThemeContext } from '@renderer/contexts/theme-context'

/**
 * テーマコンテキストを使用するフック
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
