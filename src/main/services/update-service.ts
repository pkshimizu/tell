import { app, autoUpdater as nativeUpdater, BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import { autoUpdater } from 'electron-updater'
import type { UpdateSnapshot, UpdateStatus } from '@main/models/update'
import {
  reduceUpdate,
  resolveUnsupportedReason,
  shouldCheck,
  shouldPromptRestart,
  watchdogTimeout,
  type UpdateEvent
} from '@main/services/update-state'

const INITIAL_CHECK_DELAY_MS = 10 * 1000
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const TIMEOUT_MESSAGE = 'The update did not respond. Restart tell and try again.'

type CheckSource = 'auto' | 'manual'

const updateLogger = log.scope('updater')

/**
 * GitHub Releases からのアプリ内アップデート（electron-updater）。
 *
 * Windows の NSIS インストーラーは未署名で publisherName も無いため、electron-updater は
 * 署名を検証しない。更新の完全性は同じ Release にある latest.yml の sha512 だけで担保される
 * （コード署名は #76 で扱う）。
 */
class UpdateService {
  private status: UpdateStatus = { state: 'idle' }
  private dismissedVersion: string | null = null
  // macOS で electron-updater のダウンロードが終わり、Squirrel.Mac の取り込みを待っている版
  private stagingVersion: string | null = null
  private checkSource: CheckSource = 'auto'
  private installing = false
  private timers: NodeJS.Timeout[] = []
  private watchdog: NodeJS.Timeout | null = null

  init(): void {
    const reason = resolveUnsupportedReason({
      isDev: is.dev,
      isMas: Boolean(process.mas),
      hasUpdateConfig: existsSync(join(process.resourcesPath, 'app-update.yml')),
      platform: process.platform,
      inApplicationsFolder: process.platform === 'darwin' && app.isInApplicationsFolder()
    })
    if (reason) {
      this.status = { state: 'unsupported', reason }
      updateLogger.info(`Updates are disabled: ${reason}`)
      return
    }

    autoUpdater.logger = updateLogger
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    // 確認の開始は electron-updater のイベントからだけ作る（自前で記録すると、確認が
    // 始まらなかったときに確認中のまま残るため）
    autoUpdater.on('checking-for-update', () => this.dispatch({ type: 'check-started' }))
    autoUpdater.on('update-available', (info) =>
      this.dispatch({ type: 'update-available', version: info.version })
    )
    autoUpdater.on('update-not-available', () => this.dispatch({ type: 'update-not-available' }))
    autoUpdater.on('download-progress', (progress) =>
      this.dispatch({ type: 'download-progress', percent: progress.percent })
    )
    autoUpdater.on('update-downloaded', (info) => {
      if (process.platform === 'darwin') {
        // macOS では、この後 Squirrel.Mac が ZIP を取り込み終えるまで再起動で更新できない
        this.stagingVersion = info.version
        this.dispatch({ type: 'download-progress', percent: 100 })
      } else {
        this.dispatch({ type: 'update-downloaded', version: info.version })
      }
    })
    if (process.platform === 'darwin') {
      nativeUpdater.on('update-downloaded', () => {
        if (this.stagingVersion) {
          this.dispatch({ type: 'update-downloaded', version: this.stagingVersion })
        }
      })
    }
    autoUpdater.on('error', (error) => {
      if (this.installing) {
        // インストールに失敗した場合は、もう一度「再起動して更新」を押せるように戻す
        this.installing = false
        updateLogger.error('Failed to install the update', error)
      }
      this.dispatchError(error.message)
    })

    this.timers.push(
      setTimeout(() => void this.runCheck('auto'), INITIAL_CHECK_DELAY_MS),
      setInterval(() => void this.runCheck('auto'), CHECK_INTERVAL_MS)
    )
    app.on('before-quit', () => this.dispose())
  }

  getSnapshot(): UpdateSnapshot {
    return {
      status: this.status,
      canCheck: shouldCheck(this.status),
      promptRestart: shouldPromptRestart(this.status, this.dismissedVersion)
    }
  }

  /** 手動で確認する。確認が終わった時点の状態を返す（ダウンロードの完了は待たない）。 */
  async check(): Promise<UpdateSnapshot> {
    await this.runCheck('manual')
    return this.getSnapshot()
  }

  /** 準備できた更新を適用して再起動する。準備できていなければ何もしない。 */
  install(): boolean {
    if (this.status.state !== 'ready' || this.installing) return false
    this.installing = true
    // 再起動の確認はダイアログで済ませているので、インストーラーは画面を出さずに実行し再起動する
    autoUpdater.quitAndInstall(true, true)
    return true
  }

  /** 「後で」を選んだ版を記録し、同じ版では再起動を促さない（アプリの終了時に適用される）。 */
  dismiss(version: string): void {
    this.dismissedVersion = version
    this.broadcast()
  }

  private async runCheck(source: CheckSource): Promise<void> {
    if (!shouldCheck(this.status)) return
    this.checkSource = source
    const pending = autoUpdater.checkForUpdates()
    // 確認が始まれば checking-for-update が同期的に発火して checking になる。ならなければ、
    // 前回の確認が応答しないまま残っている（electron-updater は同じ Promise を返し、
    // イベントを出さない）ので、待たずに戻る
    if (this.status.state !== 'checking') {
      pending?.catch(() => undefined)
      updateLogger.warn('The previous update check has not finished')
      if (source === 'manual') this.dispatch({ type: 'error', message: TIMEOUT_MESSAGE })
      return
    }
    try {
      // 手動確認の IPC が返らなくならないよう、確認の監視時間を待ちの上限にする
      const result = await Promise.race([
        pending,
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), watchdogTimeout({ state: 'checking' }) ?? 0)
        )
      ])
      // ダウンロードの失敗は error イベントで状態に反映する。ここでは拒否を受け止めるだけ
      result?.downloadPromise?.catch(() => undefined)
    } catch (error) {
      updateLogger.warn('Update check failed', error)
    }
  }

  /** 自動確認の確認段階のエラーは表示に残さない（reduceUpdate の quiet）。 */
  private dispatchError(message: string): void {
    this.dispatch({ type: 'error', message, quiet: this.checkSource === 'auto' })
  }

  private dispatch(event: UpdateEvent): void {
    const next = reduceUpdate(this.status, event)
    if (next === this.status) return
    this.status = next
    this.resetWatchdog()
    this.broadcast()
  }

  private resetWatchdog(): void {
    if (this.watchdog) clearTimeout(this.watchdog)
    this.watchdog = null
    const timeout = watchdogTimeout(this.status)
    if (timeout !== null) {
      this.watchdog = setTimeout(() => this.dispatchError(TIMEOUT_MESSAGE), timeout)
    }
  }

  private broadcast(): void {
    const snapshot = this.getSnapshot()
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed() || window.webContents.isDestroyed()) continue
      try {
        window.webContents.send('update:status', snapshot)
      } catch (error) {
        updateLogger.warn('Failed to send the update status', error)
      }
    }
  }

  private dispose(): void {
    for (const timer of this.timers) clearTimeout(timer)
    this.timers = []
    if (this.watchdog) clearTimeout(this.watchdog)
    this.watchdog = null
  }
}

export const updateService = new UpdateService()
