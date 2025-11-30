import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import TForm from '@renderer/components/form/form'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import useResolver from '@renderer/hooks/resolver'

export const Route = createFileRoute('/settings/github')({
  component: RouteComponent
})

interface FormData {
  token: string
}

function RouteComponent() {
  const resolver = useResolver()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: resolver.githubPersonalAccessTokenRegister
  })

  const onSubmit = (data: FormData) => {
    // TODO: 保存処理を実装
    console.log('Token:', data.token)
  }

  return (
    <TColumn gap={2} fullWidth>
      <TText variant="title">GitHub Settings</TText>
      <TForm onSubmit={handleSubmit(onSubmit)}>
        <TFormItem label="Personal Access Token">
          <TRow gap={2}>
            <TTextField
              type="password"
              register={register('token', {
                required: 'Personal Access Token is required'
              })}
              error={errors.token}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              fullWidth
            />
            <TColumn>
              <TButton type="submit" variant="contained" color="primary">
                Register
              </TButton>
            </TColumn>
          </TRow>
        </TFormItem>
      </TForm>
    </TColumn>
  )
}
