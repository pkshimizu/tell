import type { ThemeMode } from '@renderer/types/theme'

/**
 * システムのテーマを取得する
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 実際に適用するテーマを決定する
 */
export const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

/**
 * システムテーマの変更を監視する
 */
export const watchSystemTheme = (callback: (theme: 'light' | 'dark') => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent): void => {
    callback(e.matches ? 'dark' : 'light')
  }

  // MediaQueryList.addListenerは非推奨なので、addEventListenerを使用
  mediaQuery.addEventListener('change', handler)

  // クリーンアップ関数を返す
  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}
