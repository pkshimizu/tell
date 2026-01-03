import { type ReactNode, useEffect, useMemo, useState, createContext } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import type { ThemeMode } from '@renderer/types/theme'
import { darkTheme, lightTheme } from '@renderer/theme'
import { getEffectiveTheme, watchSystemTheme } from '@renderer/utils/theme-utils'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => Promise<void>
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export { ThemeContext }

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  // 初期化時にストアから設定を読み込む
  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      const storedMode = await window.api.theme.get()
      setModeState(storedMode)
      setEffectiveTheme(getEffectiveTheme(storedMode))
    }
    loadTheme()
  }, [])

  // システムテーマの変更を監視
  useEffect(() => {
    if (mode === 'system') {
      return watchSystemTheme((theme) => {
        setEffectiveTheme(theme)
      })
    }
    return undefined
  }, [mode])

  // モードが変更されたときに実効テーマを更新
  useEffect(() => {
    setEffectiveTheme(getEffectiveTheme(mode))
  }, [mode])

  const setMode = async (newMode: ThemeMode): Promise<void> => {
    await window.api.theme.set(newMode)
    setModeState(newMode)
  }

  const theme = useMemo(() => {
    return effectiveTheme === 'dark' ? darkTheme : lightTheme
  }, [effectiveTheme])

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      effectiveTheme
    }),
    [mode, effectiveTheme]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
