import Store from 'electron-store'
import { StoreSchema } from '@main/models/store/settings/github'

/**
 * electron-storeのインスタンス
 * アプリケーション設定を永続化する
 */
export const store = new Store<StoreSchema>({
  defaults: {
    settings: {
      github: {
        accounts: []
      }
    }
  }
})
