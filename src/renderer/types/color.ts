// Material-UI コンポーネントで使用可能な標準色
export type MuiColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

// カスタムテーマカラー（critical などの拡張色を含む）
export type ThemeColor = MuiColor | 'critical'

export type BackgroundColor = 'boxBackground'

export type Color = ThemeColor | BackgroundColor
