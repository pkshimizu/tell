import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TForm from '@renderer/components/form/form'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'
import useResolver from '@renderer/hooks/resolver'
import useMessage from '@renderer/hooks/message'

interface FormData {
  token: string
}

export default function GitHubAccountCreateForm() {
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
    setProcessing(true)

    try {
      const result = await window.api.settings.github.addAccount(data.token)

      if (result.success && result.data) {
        message.setMessage(
          'success',
          `Successfully registered GitHub account: ${result.data.login} (${result.data.name || 'No name'})`
        )
        reset()
      } else {
        message.setMessage('error', result.error || 'Failed to register GitHub account')
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
    <TColumn gap={2} fullWidth>
      <TForm onSubmit={handleSubmit(onSubmit)}>
        <TFormItem label="Personal Access Token">
          <TRow gap={2}>
            <TTextField
              type="password"
              register={register('token')}
              error={errors.token}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              fullWidth
              disabled={processing}
            />
            <TColumn>
              <TButton type="submit" variant="contained" color="primary" processing={processing}>
                Register
              </TButton>
            </TColumn>
          </TRow>
        </TFormItem>
      </TForm>
    </TColumn>
  )
}
