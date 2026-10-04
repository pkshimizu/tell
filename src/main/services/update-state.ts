// アプリ内アップデートの状態と遷移。electron / electron-updater に依存しない純粋関数として置き、
// update-service.ts が electron-updater のイベントをここに通して状態を決める。
// vitest から読み込むため、パスエイリアス（@main など）を使わない。

export type UnsupportedReason = 'development' | 'mas' | 'local-build' | 'not-in-applications'

export type UpdateStatus =
  | { state: 'unsupported'; reason: UnsupportedReason }
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date' }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }

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
 * レンダラーに送る更新の状態。
 * canCheck は手動の確認を受け付けるか、promptRestart は「今すぐ再起動 / 後で」を出すかどうか。
 */
export interface UpdateSnapshot {
  status: UpdateStatus
  canCheck: boolean
  promptRestart: boolean
}

/**
 * electron-updater のイベントから次の状態を決める。
 * - unsupported は以後どのイベントでも変わらない
 * - ready（再起動すれば更新できる）は、より新しい版の準備完了でだけ置き換わる。
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
      return { state: 'ready', version: event.version }
    case 'error':
      if (event.quiet && status.state === 'checking') return { state: 'idle' }
      return { state: 'error', message: event.message }
  }
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0
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
