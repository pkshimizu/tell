import type { StoreSchema } from '@main/models/store/settings/github'
import type Store from 'electron-store'

/**
 * electron-storeのインスタンス
 * アプリケーション設定を永続化する
 */
let storeInstance: Store<StoreSchema> | null = null

/**
 * electron-storeを初期化する（動的インポート）
 * electron-store v11はESMパッケージなので動的インポートが必要
 */
export async function initializeStore(): Promise<Store<StoreSchema>> {
  if (storeInstance) {
    return storeInstance
  }

  const { default: StoreConstructor } = await import('electron-store')
  storeInstance = new StoreConstructor<StoreSchema>({
    defaults: {
      settings: {
        github: {
          accounts: []
        }
      }
    }
  })

  return storeInstance
}

/**
 * 初期化済みのstoreインスタンスを取得する
 * initializeStore()を先に呼び出す必要がある
 */
export function getStore(): Store<StoreSchema> {
  if (!storeInstance) {
    throw new Error('Store is not initialized. Call initializeStore() first.')
  }
  return storeInstance
}
