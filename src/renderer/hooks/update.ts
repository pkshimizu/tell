import { useEffect } from 'react'
import { create } from 'zustand/react'
import type { UpdateSnapshot } from '@main/services/update-state'

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
 * メインプロセスの更新状態を購読する。ルートで 1 回だけ呼ぶ。
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

export default function useUpdate() {
  const snapshot = useUpdateStore((store) => store.snapshot)
  const setSnapshot = useUpdateStore((store) => store.setSnapshot)

  return {
    snapshot,
    /** 手動で確認し、確認が終わった時点の状態を返す。 */
    check: async (): Promise<UpdateSnapshot | null> => {
      const result = await window.api.update.check()
      if (!result.success || !result.data) return null
      setSnapshot(result.data)
      return result.data
    },
    install: () => window.api.update.install(),
    dismiss: (version: string) => window.api.update.dismiss(version)
  }
}
