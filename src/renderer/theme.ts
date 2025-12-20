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
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    },
    boxBackground: {
      main: '#f5f5f5' // 領域を区別するための背景色（薄い灰色）
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
