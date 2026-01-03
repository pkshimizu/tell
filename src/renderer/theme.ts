import { createTheme, type Theme } from '@mui/material/styles'

// Material-UIのPaletteを拡張してカスタム背景色を追加
declare module '@mui/material/styles' {
  interface Palette {
    boxBackground: Palette['primary']
  }
  interface PaletteOptions {
    boxBackground?: PaletteOptions['primary']
  }
}

// 共通のタイポグラフィ設定
const typography = {
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

// ライトテーマ
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#4791db',
      main: '#1976d2',
      dark: '#115293',
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#64b5f6',
      main: '#2196f3',
      dark: '#1976d2',
      contrastText: '#ffffff'
    },
    success: {
      main: '#4caf50'
    },
    warning: {
      main: '#ff9800'
    },
    error: {
      main: '#f44336'
    },
    info: {
      main: '#2196f3'
    },
    boxBackground: {
      main: '#e3f2fd'
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    }
  },
  typography
})

// ダークテーマ
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#b3d4fc',
      main: '#90caf9',
      dark: '#5a95db',
      contrastText: '#000000'
    },
    secondary: {
      light: '#b3d4fc',
      main: '#90caf9',
      dark: '#5a95db',
      contrastText: '#000000'
    },
    success: {
      main: '#66bb6a'
    },
    warning: {
      main: '#ffa726'
    },
    error: {
      main: '#f44336'
    },
    info: {
      main: '#90caf9'
    },
    boxBackground: {
      main: '#1e1e1e'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  },
  typography
})

// デフォルトテーマ（後方互換性のため）
export const theme = lightTheme
