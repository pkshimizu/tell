/**
 * ディスプレイ情報
 */
export interface WindowDisplay {
  id: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * ウィンドウの状態を保存する型定義
 */
export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
  isFullScreen: boolean
  display?: WindowDisplay
}

/**
 * デフォルトのウィンドウ設定
 */
export const defaultWindowState: WindowState = {
  width: 1024,
  height: 768,
  isMaximized: false,
  isFullScreen: false
}
