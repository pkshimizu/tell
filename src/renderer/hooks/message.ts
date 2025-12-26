import { create } from 'zustand/react'

export type Severity = 'error' | 'info' | 'success'

type MessageStore = {
  severity: Severity | null
  message: string | null
  setMessage: (severity: Severity, message: string) => void
  clearMessage: () => void
}

const useMessageStore = create<MessageStore>((set) => ({
  severity: null,
  message: null,
  setMessage: (severity: Severity, message: string) => {
    set({ severity, message })
  },
  clearMessage: () => {
    set({ severity: null, message: null })
  }
}))

export default function useMessage() {
  const store = useMessageStore()

  return {
    severity: store.severity,
    message: store.message,
    setMessage: store.setMessage,
    clearMessage: store.clearMessage
  }
}
