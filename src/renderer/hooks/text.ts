import dayjs from 'dayjs'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useText() {
  return {
    formatDateTime(date: string | Date | null, options?: { defaultText?: string }): string | null {
      if (date === null) {
        if (options?.defaultText) {
          return options.defaultText
        }
        return null
      }
      return dayjs(date).format('YYYY/MM/DD HH:mm:ss')
    }
  }
}
