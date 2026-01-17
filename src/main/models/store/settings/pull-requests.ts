/**
 * ソートキーの定義
 */
export type SortKey = 'createdAt' | 'updatedAt' | 'author'

/**
 * ソート順序の定義
 */
export type SortOrder = 'asc' | 'desc'

/**
 * electron-storeで管理するプルリクエスト設定
 */
export interface StoreSettingsPullRequests {
  sortBy: SortKey
  sortOrder: SortOrder
}
