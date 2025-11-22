import { grey } from '@mui/material/colors'

export type ThemeColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'caution'
  | 'black'
  | 'white'

export type PanelColor = 'header' | 'data' | 'black'

export type Color = ThemeColor & PanelColor

export function toTextColor(color?: ThemeColor) {
  if (!color) return undefined
  switch (color) {
    case 'inherit':
      return 'inherit'
    default:
      return `${color}.contrastText`
  }
}

export function toBgColor(color?: ThemeColor) {
  if (!color) return undefined
  switch (color) {
    case 'inherit':
      return 'inherit'
    default:
      return `${color}.main`
  }
}

export function toBorderColor(color?: ThemeColor) {
  if (!color) return undefined
  switch (color) {
    case 'inherit':
      return 'inherit'
    default:
      return `${color}.main`
  }
}

export function toIconColor(color?: ThemeColor) {
  if (!color) return undefined
  return color
}

export function toPanelBgColor(color: PanelColor) {
  switch (color) {
    case 'header':
      return grey[200]
    case 'black':
      return '#252A36'
    case 'data':
      return 'inherit'
  }
}

export function toPanelBorderColor(color: PanelColor) {
  switch (color) {
    case 'header':
      return grey[300]
    case 'black':
      return '#252A36'
    case 'data':
      return grey[300]
  }
}
