// アプリ内アップデートの状態と遷移。electron / electron-updater に依存しない純粋関数として置き、
// update-service.ts が electron-updater のイベントをここに通して状態を決める。
// vitest にはパスエイリアスの設定が無いため、値の import を足すときは相対パスにする
// （型だけの import はビルド時に消えるのでエイリアスでよい）。

import type { UnsupportedReason, UpdateStatus } from '@main/models/update'

export type { UnsupportedReason, UpdateSnapshot, UpdateStatus } from '@main/models/update'

export type UpdateEvent =
  | { type: 'check-started' }
  | { type: 'update-available'; version: string }
  | { type: 'update-not-available' }
  | { type: 'download-progress'; percent: number }
  | { type: 'update-downloaded'; version: string }
  // quiet: 自動チェックの確認段階のエラー。一時的な失敗（通信断、Release の公開途中など）を
  // 次の確認まで表示に残さないよう、確認中なら idle に戻す
  | { type: 'error'; message: string; quiet?: boolean }

/**
 * electron-updater のイベントから次の状態を決める。
 * - unsupported は以後どのイベントでも変わらない
 * - ready（再起動すれば更新できる）は、別の版の準備完了でだけ置き換わる。
 *   ready の間は確認しない（shouldCheck）ので、保留中にさらに新しい版が出ても次の起動まで検出しない
 */
export function reduceUpdate(status: UpdateStatus, event: UpdateEvent): UpdateStatus {
  if (status.state === 'unsupported') return status
  if (status.state === 'ready' && event.type !== 'update-downloaded') return status

  switch (event.type) {
    case 'check-started':
      return status.state === 'downloading' ? status : { state: 'checking' }
    case 'update-available':
      return status.state === 'downloading' && status.version === event.version
        ? status
        : { state: 'downloading', version: event.version, percent: 0 }
    case 'update-not-available':
      return status.state === 'checking' ? { state: 'up-to-date' } : status
    case 'download-progress':
      return status.state === 'downloading'
        ? { ...status, percent: clampPercent(event.percent) }
        : status
    case 'update-downloaded':
      return status.state === 'ready' && status.version === event.version
        ? status
        : { state: 'ready', version: event.version }
    case 'error':
      if (event.quiet && status.state === 'checking') return { state: 'idle' }
      return { state: 'error', message: event.message }
  }
}

function clampPercent(percent: number): number {
  if (Number.isNaN(percent)) return 0
  return Math.min(100, Math.max(0, percent))
}

/** 定期・手動の確認を始めてよいか。確認中・ダウンロード中・ダウンロード済み・対象外では確認しない。 */
export function shouldCheck(status: UpdateStatus): boolean {
  return status.state === 'idle' || status.state === 'up-to-date' || status.state === 'error'
}

/** 準備できた版について、まだ「後で」を選んでいなければ再起動を促す。 */
export function shouldPromptRestart(
  status: UpdateStatus,
  dismissedVersion: string | null
): boolean {
  return status.state === 'ready' && status.version !== dismissedVersion
}

// electron-updater の通信は、スリープ明けなどで応答が返らないまま止まることがある。
// 確認中・ダウンロード中のまま固まらないよう、一定時間で失敗扱いにする
const CHECK_TIMEOUT_MS = 2 * 60 * 1000
const DOWNLOAD_STALL_TIMEOUT_MS = 10 * 60 * 1000

/** 状態ごとの監視時間。確認中とダウンロード中（進捗が止まった時間）だけを見る。 */
export function watchdogTimeout(status: UpdateStatus): number | null {
  if (status.state === 'checking') return CHECK_TIMEOUT_MS
  if (status.state === 'downloading') return DOWNLOAD_STALL_TIMEOUT_MS
  return null
}

/** アップデートを確認しない理由を、優先度の高い順に判定する。確認してよければ null。 */
export function resolveUnsupportedReason(environment: {
  isDev: boolean
  isMas: boolean
  hasUpdateConfig: boolean
  platform: string
  inApplicationsFolder: boolean
}): UnsupportedReason | null {
  if (environment.isDev) return 'development'
  if (environment.isMas) return 'mas'
  // ローカルビルドは electron-builder.yml の publish: null で app-update.yml を持たない
  if (!environment.hasUpdateConfig) return 'local-build'
  // /Applications 以外（DMG 上や App Translocation）では Squirrel.Mac が更新を適用できない
  if (environment.platform === 'darwin' && !environment.inApplicationsFolder) {
    return 'not-in-applications'
  }
  return null
}
