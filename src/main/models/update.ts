/** アップデートを確認しない理由 */
export type UnsupportedReason = 'development' | 'mas' | 'local-build' | 'not-in-applications'

/** アプリ内アップデートの状態 */
export type UpdateStatus =
  | { state: 'unsupported'; reason: UnsupportedReason }
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date' }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }

/**
 * レンダラーに送る更新の状態。
 * canCheck は手動の確認を受け付けるか、promptRestart は「今すぐ再起動 / 後で」を出すかどうか。
 */
export interface UpdateSnapshot {
  status: UpdateStatus
  canCheck: boolean
  promptRestart: boolean
}
