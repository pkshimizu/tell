import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  currentTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // システムのテーマを取得
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      if (mode === 'system') {
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setCurrentTheme(mode === 'dark' ? 'dark' : 'light')
      }
    }

    updateTheme()

    // システムテーマの変更を監視
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [mode])

  useEffect(() => {
    // テーマをdocument.bodyに適用
    document.body.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ mode, setMode, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}