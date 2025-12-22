import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TAlert from '@renderer/components/feedback/alert'
import TForm from '@renderer/components/form/form'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'
import useResolver from '@renderer/hooks/resolver'

interface FormData {
  token: string
}

export default function GitHubAccountCreateForm() {
  const resolver = useResolver()
  const [processing, setProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const result = await window.api.settings.github.addAccount(data.token)

      if (result.success && result.data) {
        setSuccessMessage(
          `Successfully registered GitHub account: ${result.data.login} (${result.data.name || 'No name'})`
        )
        reset()
      } else {
        setErrorMessage(result.error || 'Failed to register GitHub account')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <TColumn gap={2} fullWidth>
      {successMessage && <TAlert severity="success">{successMessage}</TAlert>}
      {errorMessage && <TAlert severity="error">{errorMessage}</TAlert>}

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
