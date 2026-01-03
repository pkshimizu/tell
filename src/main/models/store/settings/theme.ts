/**
 * テーマモードの定義
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * electron-storeで管理するテーマ設定
 */
export interface StoreSettingsTheme {
  mode: ThemeMode
}
