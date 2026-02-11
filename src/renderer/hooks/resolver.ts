import useValidation from '@renderer/hooks/validation'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

export default function useResolver() {
  const validation = useValidation()

  return {
    githubPersonalAccessTokenRegister: yupResolver(
      yup.object({
        token: validation.githubPersonalAccessToken
      })
    ),
    githubPersonalAccessTokenUpdate: yupResolver(
      yup.object({
        accountId: yup.string().required(),
        token: validation.githubPersonalAccessToken
      })
    )
  }
}
