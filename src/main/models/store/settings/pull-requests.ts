/**
 * ソートキーの定義
 */
export type SortKey = 'createdAt' | 'updatedAt' | 'author'

/**
 * ソート順序の定義
 */
export type SortOrder = 'asc' | 'desc'

/**
 * リロード間隔の定義（分単位）
 */
export type ReloadInterval = 1 | 3 | 5 | 10 | 15

/**
 * electron-storeで管理するプルリクエスト設定
 */
export interface StoreSettingsPullRequests {
  sortBy: SortKey
  sortOrder: SortOrder
  reloadInterval: ReloadInterval
}
