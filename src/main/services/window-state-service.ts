import { BrowserWindow, screen } from 'electron'
import type Store from 'electron-store'
import type { StoreSchema } from '@main/models/store/settings/github'
import { defaultWindowState, type WindowState } from '@main/models/store/window'

/**
 * ウィンドウ状態管理サービス
 * ウィンドウの位置とサイズを保存・復元する
 */
export class WindowStateService {
  private store: Store<StoreSchema>
  private window: BrowserWindow | null = null
  private saveTimer: NodeJS.Timeout | null = null

  constructor(store: Store<StoreSchema>) {
    this.store = store
  }

  /**
   * 保存されているウィンドウ状態を取得
   */
  getWindowState(): WindowState {
    const savedState = this.store.get('window')
    if (!savedState) {
      return this.getCenteredWindowState()
    }

    // 保存された状態が画面内にあるか確認
    if (this.isWindowStateValid(savedState)) {
      return savedState
    }

    // 無効な場合は中央配置の状態を返す
    return this.getCenteredWindowState()
  }

  /**
   * ウィンドウの状態を管理開始
   */
  manage(window: BrowserWindow): void {
    this.window = window

    // ウィンドウイベントをリッスン
    window.on('resize', () => this.scheduleSave())
    window.on('move', () => this.scheduleSave())
    window.on('close', () => this.saveWindowState())
    window.on('maximize', () => this.scheduleSave())
    window.on('unmaximize', () => this.scheduleSave())
    window.on('enter-full-screen', () => this.scheduleSave())
    window.on('leave-full-screen', () => this.scheduleSave())
  }

  /**
   * 画面中央に配置されたデフォルト状態を取得
   */
  private getCenteredWindowState(): WindowState {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const { x, y } = primaryDisplay.bounds

    const windowWidth = Math.min(defaultWindowState.width, width * 0.8)
    const windowHeight = Math.min(defaultWindowState.height, height * 0.8)

    return {
      ...defaultWindowState,
      x: Math.round(x + (width - windowWidth) / 2),
      y: Math.round(y + (height - windowHeight) / 2),
      width: windowWidth,
      height: windowHeight
    }
  }

  /**
   * ウィンドウの状態が有効かどうかを確認
   */
  private isWindowStateValid(state: WindowState): boolean {
    const displays = screen.getAllDisplays()

    // 最小サイズチェック
    if (state.width < 400 || state.height < 300) {
      return false
    }

    // 最大化またはフルスクリーン状態の場合は有効とみなす
    if (state.isMaximized || state.isFullScreen) {
      return true
    }

    // 位置が指定されていない場合は無効
    if (state.x === undefined || state.y === undefined) {
      return false
    }

    // いずれかのディスプレイ内に少なくとも一部が表示されているか確認
    for (const display of displays) {
      const { x, y, width, height } = display.bounds

      // ウィンドウの少なくとも100x100ピクセルが画面内にあるか
      const windowRight = state.x + state.width
      const windowBottom = state.y + state.height
      const displayRight = x + width
      const displayBottom = y + height

      const overlapX = Math.min(windowRight, displayRight) - Math.max(state.x, x)
      const overlapY = Math.min(windowBottom, displayBottom) - Math.max(state.y, y)

      if (overlapX >= 100 && overlapY >= 100) {
        return true
      }
    }

    return false
  }

  /**
   * ウィンドウ状態の保存をスケジュール（デバウンス処理）
   */
  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(() => {
      this.saveWindowState()
    }, 500)
  }

  /**
   * 現在のウィンドウ状態を保存
   */
  private saveWindowState(): void {
    if (!this.window) {
      return
    }

    const bounds = this.window.getBounds()
    const currentDisplay = screen.getDisplayMatching(bounds)

    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: this.window.isMaximized(),
      isFullScreen: this.window.isFullScreen(),
      display: {
        bounds: currentDisplay.bounds
      }
    }

    this.store.set('window', state)
  }
}
