import { useState } from 'react'
import { useForm } from 'react-hook-form'
import TDialog from '@renderer/components/feedback/dialog'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import useResolver from '@renderer/hooks/resolver'
import useMessage from '@renderer/hooks/message'
import { GitHubAccount } from '@renderer/types/github'

interface FormData {
  token: string
}

interface Props {
  open: boolean
  account: GitHubAccount | null
  onClose: () => void
  onTokenUpdated?: (account: GitHubAccount) => void
}

export default function GitHubAccountUpdateTokenDialog({
  open,
  account,
  onClose,
  onTokenUpdated
}: Props) {
  const message = useMessage()
  const resolver = useResolver()
  const [processing, setProcessing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: resolver.githubPersonalAccessTokenRegister
  })

  const onSubmit = async (data: FormData) => {
    if (!account) return

    setProcessing(true)

    try {
      const result = await window.api.settings.github.updateAccountToken(
        String(account.id),
        data.token
      )

      if (result.success && result.data) {
        message.setMessage('success', `Token updated for ${account.login}`)
        reset()
        if (onTokenUpdated) {
          onTokenUpdated(result.data)
        }
        onClose()
      } else {
        message.setMessage('error', result.error || 'Failed to update token')
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

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <TDialog
      open={open}
      title="Update Token"
      size="sm"
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      actions={
        <TRow gap={1}>
          <TButton onClick={handleClose} disabled={processing}>
            Cancel
          </TButton>
          <TButton type="submit" variant="contained" color="primary" processing={processing}>
            Update
          </TButton>
        </TRow>
      }
    >
      <TColumn gap={2}>
        {account && (
          <TRow gap={0.5}>
            <TText>Update the Personal Access Token for</TText>
            <TText bold>{account.login}</TText>
          </TRow>
        )}
        <TFormItem label="New Personal Access Token">
          <TTextField
            type="password"
            register={register('token')}
            error={errors.token}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            fullWidth
            disabled={processing}
          />
        </TFormItem>
      </TColumn>
    </TDialog>
  )
}
