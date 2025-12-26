import TSnackbar from '@renderer/components/feedback/snackbar'
import useMessage from '@renderer/hooks/message'

export default function SystemMessage() {
  const { severity, message, clearMessage } = useMessage()

  if (severity === null || message === null) return null

  return <TSnackbar open={true} message={message} severity={severity} onClose={clearMessage} />
}
