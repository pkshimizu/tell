import * as yup from 'yup'

export default function useValidation() {
  return {
    githubPersonalAccessToken: yup.string().label('GitHub Personal Access Token').required()
  }
}
