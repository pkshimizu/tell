import TDialog from '@renderer/components/feedback/dialog'
import { useEffect, useState } from 'react'
import TSelect from '@renderer/components/form/select'
import TList from '@renderer/components/display/list'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import { useForm } from 'react-hook-form'
import TFormItem from '@renderer/components/form/form-item'

interface Props {
  open: boolean
  accountId: number | null
  onClose: () => void
}

interface Organization {
  login: string
  htmlUrl: string
  avatarUrl: string
}

interface Repository {
  name: string
  htmlUrl: string
}

interface FormValues {
  organization: string
}

export default function GitHubRepositorySelectDialog(props: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)

  const { control, watch } = useForm<FormValues>({
    defaultValues: {
      organization: ''
    }
  })

  const selectedOrg = watch('organization')

  useEffect(() => {
    if (props.open && props.accountId) {
      ;(async () => {
        const result = await window.api.github.getOrganizations(props.accountId!)
        if (result.success && result.data) {
          setOrganizations(result.data)
        }
      })()
    }
  }, [props.open, props.accountId])

  useEffect(() => {
    if (selectedOrg && props.accountId) {
      setLoading(true)
      ;(async () => {
        const result = await window.api.github.getRepositories(props.accountId!, selectedOrg)
        if (result.success && result.data) {
          setRepositories(result.data)
        }
        setLoading(false)
      })()
    } else {
      setRepositories([])
    }
  }, [selectedOrg, props.accountId])

  return (
    <TDialog open={props.open} onClose={props.onClose} title="Select Repository" size="md">
      <TColumn gap={2}>
        <TFormItem label="Organization">
          <TSelect
            control={control}
            name="organization"
            items={organizations.map((org) => ({
              value: org.login,
              label: org.login
            }))}
          />
        </TFormItem>

        {loading && <TCircularProgress size={40} />}

        {!loading && repositories.length > 0 && (
          <TColumn gap={1}>
            <TText variant="caption">Repositories</TText>
            <TList
              items={repositories.map((repo) => ({
                id: repo.name,
                text: repo.name,
                onClick: () => {
                  window.open(repo.htmlUrl, '_blank')
                }
              }))}
            />
          </TColumn>
        )}
      </TColumn>
    </TDialog>
  )
}
