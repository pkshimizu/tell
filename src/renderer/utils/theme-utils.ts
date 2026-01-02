/**
 * テーマ関連のユーティリティ関数
 */

export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * ローカルストレージにテーマ設定を保存
 */
export function saveThemePreference(mode: ThemeMode): void {
  localStorage.setItem('theme-preference', mode)
}

/**
 * ローカルストレージからテーマ設定を取得
 */
export function getThemePreference(): ThemeMode {
  const saved = localStorage.getItem('theme-preference')
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved
  }
  return 'system' // デフォルトはシステム設定に従う
}

/**
 * システムのダークモード設定を取得
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * 実際に適用するテーマを決定
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

/**
 * テーマカラーのヘルパー関数
 */
export const themeColors = {
  light: {
    primary: '#1976d2',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666'
  },
  dark: {
    primary: '#90caf9',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b3b3b3'
  }
}

/**
 * 現在のテーマに応じたカラーを取得
 */
export function getThemeColor(theme: 'light' | 'dark', colorKey: keyof typeof themeColors.light): string {
  return themeColors[theme][colorKey]
}