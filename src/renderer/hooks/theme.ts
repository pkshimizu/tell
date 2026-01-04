import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '@renderer/contexts/theme-context'

/**
 * テーマコンテキストを使用するフック
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
