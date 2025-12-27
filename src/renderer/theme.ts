import { createTheme } from '@mui/material/styles'

// Material-UIのPaletteを拡張してカスタム背景色を追加
declare module '@mui/material/styles' {
  interface Palette {
    boxBackground: Palette['primary']
  }
  interface PaletteOptions {
    boxBackground?: PaletteOptions['primary']
  }
}

// MUIのデフォルトテーマをカスタマイズ
// メインカラー: ディープブルー - 信頼性、安定性、情報を象徴する色
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#4791db', // ライトブルー（ホバー時などに使用）
      main: '#1976d2', // ディープブルー（メインカラー）
      dark: '#115293', // ダークブルー（アクティブ時などに使用）
      contrastText: '#ffffff' // 白文字
    },
    secondary: {
      light: '#64b5f6', // ライトブルー
      main: '#2196f3', // ブライトブルー（アクセントカラー）
      dark: '#1976d2', // ディープブルー
      contrastText: '#ffffff' // 白文字
    },
    success: {
      main: '#4caf50' // グリーン（成功・承認を示す）
    },
    warning: {
      main: '#ff9800' // オレンジ（警告・注意を示す）
    },
    error: {
      main: '#f44336' // レッド（エラー・拒否を示す）
    },
    info: {
      main: '#2196f3' // ブライトブルー（情報を示す）
    },
    boxBackground: {
      main: '#e3f2fd' // 薄いブルー（ディープブルーに調和する背景色）
    },
    background: {
      default: '#fafafa', // デフォルト背景
      paper: '#ffffff' // カードやパネルの背景
    }
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(',')
  }
})
