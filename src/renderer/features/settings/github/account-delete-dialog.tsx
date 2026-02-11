import { useState } from 'react'
import TDialog from '@renderer/components/feedback/dialog'
import TButton from '@renderer/components/form/button'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import useMessage from '@renderer/hooks/message'
import { GitHubAccount } from '@renderer/types/github'

interface Props {
  open: boolean
  account: GitHubAccount | null
  onClose: () => void
  onDeleted?: () => void
}

export default function GitHubAccountDeleteDialog({ open, account, onClose, onDeleted }: Props) {
  const message = useMessage()
  const [processing, setProcessing] = useState(false)

  const handleDelete = async () => {
    if (!account) return

    setProcessing(true)

    try {
      const result = await window.api.settings.github.deleteAccount(String(account.id))

      if (result.success) {
        message.setMessage('success', `Account ${account.login} has been deleted`)
        onClose()
        if (onDeleted) {
          onDeleted()
        }
      } else {
        message.setMessage('error', result.error || 'Failed to delete account')
      }
    } catch (error) {
      message.setMessage(
        'error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <TDialog
      open={open}
      title="Delete Account"
      size="sm"
      onClose={onClose}
      actions={
        <TRow gap={1}>
          <TButton onClick={onClose} disabled={processing}>
            Cancel
          </TButton>
          <TButton variant="contained" color="error" onClick={handleDelete} processing={processing}>
            Delete
          </TButton>
        </TRow>
      }
    >
      <TColumn gap={2}>
        {account && (
          <TColumn gap={1}>
            <TText>Are you sure you want to delete the following account?</TText>
            <TText bold>{account.login}</TText>
            <TText variant="caption">
              This will remove the account and all associated repository settings.
            </TText>
          </TColumn>
        )}
      </TColumn>
    </TDialog>
  )
}
