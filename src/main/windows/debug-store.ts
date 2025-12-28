import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'

let debugStoreWindow: BrowserWindow | null = null

/**
 * デバッグストアウィンドウを作成または表示する
 */
export function createOrShowDebugStoreWindow(): void {
  // 開発モードでない場合は何もしない
  if (!is.dev) {
    console.warn('Debug Store Window is only available in development mode')
    return
  }

  // 既にウィンドウが存在する場合は、フォーカスを当てる
  if (debugStoreWindow && !debugStoreWindow.isDestroyed()) {
    if (debugStoreWindow.isMinimized()) {
      debugStoreWindow.restore()
    }
    debugStoreWindow.focus()
    return
  }

  // 新しいウィンドウを作成
  debugStoreWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: 'Debug Store Viewer',
    icon: icon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 開発サーバーまたはローカルファイルをロード
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // デバッグストアページへのパスを指定
    debugStoreWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/debug/store`)
  } else {
    debugStoreWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/debug/store'
    })
  }

  // ウィンドウが閉じられたときの処理
  debugStoreWindow.on('closed', () => {
    debugStoreWindow = null
  })
}

/**
 * デバッグストアウィンドウを閉じる
 */
export function closeDebugStoreWindow(): void {
  if (debugStoreWindow && !debugStoreWindow.isDestroyed()) {
    debugStoreWindow.close()
    debugStoreWindow = null
  }
}
