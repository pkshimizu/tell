import dayjs, { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useText() {
  extend(relativeTime)
  return {
    formatDateTime(date: string | Date | null, options?: { defaultText?: string }): string | null {
      if (date === null) {
        if (options?.defaultText) {
          return options.defaultText
        }
        return null
      }
      return dayjs(date).format('YYYY/MM/DD HH:mm:ss')
    },
    fromNow: (date: string) => {
      return dayjs(date).fromNow()
    }
  }
}
