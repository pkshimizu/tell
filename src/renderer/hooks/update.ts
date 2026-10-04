import { useEffect } from 'react'
import { create } from 'zustand/react'
import type { UpdateSnapshot } from '@main/models/update'

type UpdateStore = {
  snapshot: UpdateSnapshot | null
  setSnapshot: (snapshot: UpdateSnapshot) => void
}

const useUpdateStore = create<UpdateStore>((set) => ({
  snapshot: null,
  setSnapshot: (snapshot: UpdateSnapshot) => {
    set({ snapshot })
  }
}))

/**
 * メインプロセスの更新状態を購読する。ルートコンポーネントで 1 回だけ呼ぶ。
 * 先に購読してから現在の状態を取得する（取得の間に届いた変化を取りこぼさないため）。
 */
export function useUpdateSubscription() {
  const setSnapshot = useUpdateStore((store) => store.setSnapshot)

  useEffect(() => {
    const unsubscribe = window.api.update.onStatus(setSnapshot)
    void window.api.update.getStatus().then((result) => {
      if (result.success && result.data) setSnapshot(result.data)
    })
    return unsubscribe
  }, [setSnapshot])
}

/** 再起動すれば更新できる状態か。ダウンロードの進捗では再描画しない。 */
export function useUpdateReady() {
  return useUpdateStore((store) => store.snapshot?.status.state === 'ready')
}

export default function useUpdate() {
  const snapshot = useUpdateStore((store) => store.snapshot)
  const setSnapshot = useUpdateStore((store) => store.setSnapshot)

  return {
    snapshot,
    /** 手動で確認する。確認が終わった時点の状態で store を更新し、IPC の結果を返す。 */
    check: async () => {
      const result = await window.api.update.check()
      if (result.success && result.data) setSnapshot(result.data)
      return result
    },
    install: () => window.api.update.install(),
    dismiss: (version: string) => window.api.update.dismiss(version)
  }
}
