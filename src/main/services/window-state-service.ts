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

    // マルチディスプレイ対応: 保存されたディスプレイ情報を考慮して復元
    const adjustedState = this.adjustWindowStateForCurrentDisplays(savedState)

    // 調整後の状態が画面内にあるか確認
    if (this.isWindowStateValid(adjustedState)) {
      return adjustedState
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
   * 現在のディスプレイ構成に合わせてウィンドウ状態を調整
   */
  private adjustWindowStateForCurrentDisplays(savedState: WindowState): WindowState {
    // 保存されたディスプレイ情報がない場合はそのまま返す
    if (!savedState.display || savedState.x === undefined || savedState.y === undefined) {
      return savedState
    }

    const currentDisplays = screen.getAllDisplays()
    const savedDisplay = savedState.display

    // 同じサイズのディスプレイを探す
    const matchingDisplay = currentDisplays.find(
      (display) =>
        display.bounds.width === savedDisplay.bounds.width &&
        display.bounds.height === savedDisplay.bounds.height
    )

    if (matchingDisplay) {
      // 同じサイズのディスプレイが見つかった場合、相対位置を維持して復元
      const relativeX = savedState.x - savedDisplay.bounds.x
      const relativeY = savedState.y - savedDisplay.bounds.y

      return {
        ...savedState,
        x: matchingDisplay.bounds.x + relativeX,
        y: matchingDisplay.bounds.y + relativeY,
        display: {
          bounds: matchingDisplay.bounds
        }
      }
    }

    // 同じサイズのディスプレイが見つからない場合、
    // 保存時のディスプレイに最も近い位置のディスプレイを探す
    const savedCenterX = savedDisplay.bounds.x + savedDisplay.bounds.width / 2
    const savedCenterY = savedDisplay.bounds.y + savedDisplay.bounds.height / 2

    let closestDisplay = currentDisplays[0]
    let minDistance = Infinity

    for (const display of currentDisplays) {
      const centerX = display.bounds.x + display.bounds.width / 2
      const centerY = display.bounds.y + display.bounds.height / 2
      const distance = Math.sqrt(
        Math.pow(centerX - savedCenterX, 2) + Math.pow(centerY - savedCenterY, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestDisplay = display
      }
    }

    // ウィンドウが新しいディスプレイに収まるように調整
    const relativeX = (savedState.x - savedDisplay.bounds.x) / savedDisplay.bounds.width
    const relativeY = (savedState.y - savedDisplay.bounds.y) / savedDisplay.bounds.height

    let newX = closestDisplay.bounds.x + relativeX * closestDisplay.bounds.width
    let newY = closestDisplay.bounds.y + relativeY * closestDisplay.bounds.height

    // ウィンドウが画面外に出ないように調整
    const maxX = closestDisplay.bounds.x + closestDisplay.bounds.width - savedState.width
    const maxY = closestDisplay.bounds.y + closestDisplay.bounds.height - savedState.height

    newX = Math.max(closestDisplay.bounds.x, Math.min(newX, maxX))
    newY = Math.max(closestDisplay.bounds.y, Math.min(newY, maxY))

    return {
      ...savedState,
      x: Math.round(newX),
      y: Math.round(newY),
      display: {
        bounds: closestDisplay.bounds
      }
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
