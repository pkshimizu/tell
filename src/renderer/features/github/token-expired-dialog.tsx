import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import TDialog from '@renderer/components/feedback/dialog'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'
import TSelect from '@renderer/components/form/select'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import useResolver from '@renderer/hooks/resolver'
import useMessage from '@renderer/hooks/message'
import { GitHubAccount } from '@renderer/types/github'

interface FormData {
  accountId: string
  token: string
}

interface Props {
  open: boolean
  accounts: GitHubAccount[]
  onClose: () => void
  onTokenUpdated?: () => void
}

export default function GitHubTokenExpiredDialog({
  open,
  accounts,
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
    reset,
    control,
    setValue
  } = useForm<FormData>({
    resolver: resolver.githubPersonalAccessTokenUpdate,
    defaultValues: {
      accountId: '',
      token: ''
    }
  })

  // ダイアログが開いたとき、またはaccountsが読み込まれたらaccountIdを設定
  useEffect(() => {
    if (open && accounts.length > 0) {
      setValue('accountId', String(accounts[0].id))
    }
  }, [open, accounts, setValue])

  const accountItems = accounts.map((account) => ({
    value: String(account.id),
    label: account.login
  }))

  const onSubmit = async (data: FormData) => {
    setProcessing(true)

    try {
      const result = await window.api.settings.github.updateAccountToken(data.accountId, data.token)

      if (result.success) {
        message.setMessage('success', `Token updated for ${result.data?.login ?? 'account'}`)
        reset()
        onClose()
        if (onTokenUpdated) {
          onTokenUpdated()
        }
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
      title="Token Update Required"
      size="sm"
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      actions={
        <TRow gap={1}>
          <TButton onClick={handleClose} disabled={processing}>
            Cancel
          </TButton>
          <TButton type="submit" variant="contained" color="primary" processing={processing}>
            Update Token
          </TButton>
        </TRow>
      }
    >
      <TColumn gap={2}>
        <TText>
          Your GitHub token has expired or is invalid. Please update your token to continue.
        </TText>
        {accounts.length > 1 && (
          <TFormItem label="Account">
            <TSelect name="accountId" control={control} items={accountItems} />
          </TFormItem>
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
