import TDialog from '@renderer/components/feedback/dialog'
import { useCallback, useEffect, useState } from 'react'
import TSelect from '@renderer/components/form/select'
import TList from '@renderer/components/display/list'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TCircularProgress from '@renderer/components/feedback/circular-progress'
import { useForm } from 'react-hook-form'
import TFormItem from '@renderer/components/form/form-item'
import TTextField from '@renderer/components/form/text-field'
import TButton from '@renderer/components/form/button'

interface Props {
  open: boolean
  accountId: number | null
  onClose: () => void
}

interface Owner {
  login: string
  htmlUrl: string
  avatarUrl: string | null
}

interface Repository {
  name: string
  htmlUrl: string
}

interface FormValues {
  owner: string
  filterKeyword: string
}

export default function GitHubRepositorySelectDialog(props: Props) {
  const [owners, setOwners] = useState<Owner[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([])
  const [registeredRepositories, setRegisteredRepositories] = useState<Set<string>>(new Set())

  const { register, control, watch } = useForm<FormValues>({
    defaultValues: {
      owner: '',
      filterKeyword: ''
    }
  })

  const selectedOwner = watch('owner')
  const filterKeyword = watch('filterKeyword')

  const loadRegisteredRepositories = useCallback(async () => {
    if (!props.accountId || !selectedOwner) return

    const result = await window.api.settings.github.getRepositories(props.accountId, selectedOwner)
    if (result.success && result.data) {
      setRegisteredRepositories(new Set(result.data.map((repo) => repo.name)))
    }
  }, [props.accountId, selectedOwner])

  const handleAddRepository = async (repository: Repository) => {
    if (!props.accountId) return

    const owner = owners.find((o) => o.login === selectedOwner)
    if (!owner) return

    const result = await window.api.settings.github.addRepository(
      props.accountId,
      owner.login,
      owner.htmlUrl,
      owner.avatarUrl,
      repository.name,
      repository.htmlUrl
    )

    if (result.success) {
      await loadRegisteredRepositories()
    }
  }

  const handleRemoveRepository = async (repository: Repository) => {
    if (!props.accountId) return

    const result = await window.api.settings.github.removeRepository(
      props.accountId,
      selectedOwner,
      repository.name
    )

    if (result.success) {
      await loadRegisteredRepositories()
    }
  }

  useEffect(() => {
    if (props.open && props.accountId) {
      ;(async () => {
        const result = await window.api.github.getOwners(props.accountId!)
        if (result.success && result.data) {
          setOwners(result.data)
        }
      })()
    }
  }, [props.open, props.accountId])

  useEffect(() => {
    if (selectedOwner && props.accountId) {
      setLoading(true)
      ;(async () => {
        const result = await window.api.github.getRepositories(props.accountId!, selectedOwner)
        if (result.success && result.data) {
          setRepositories(result.data)
        }
        await loadRegisteredRepositories()
        setLoading(false)
      })()
    } else {
      setRepositories([])
      setRegisteredRepositories(new Set())
    }
  }, [selectedOwner, props.accountId, loadRegisteredRepositories])

  useEffect(() => {
    if (filterKeyword) {
      setFilteredRepositories(
        repositories.filter((repository) =>
          repository.name.toLowerCase().includes(filterKeyword.trim())
        )
      )
    } else {
      setFilteredRepositories(repositories)
    }
  }, [filterKeyword, repositories])

  return (
    <TDialog open={props.open} onClose={props.onClose} title="Select Repository" size="md">
      <TColumn gap={2} height={480}>
        <TFormItem label="Organization">
          <TSelect
            control={control}
            name="owner"
            items={owners.map((owner) => ({
              value: owner.login,
              label: owner.login
            }))}
          />
        </TFormItem>

        {loading && <TCircularProgress size={40} />}

        {!loading && repositories.length > 0 && (
          <TColumn gap={1}>
            <TText variant="caption">Repositories</TText>
            <TTextField register={register('filterKeyword')} />
            <TList
              items={filteredRepositories.map((repo) => {
                const isRegistered = registeredRepositories.has(repo.name)
                return {
                  id: repo.name,
                  content: (
                    <TRow justify={'space-between'} align={'center'}>
                      <TText>{repo.name}</TText>
                      <TButton
                        onClick={() =>
                          isRegistered ? handleRemoveRepository(repo) : handleAddRepository(repo)
                        }
                      >
                        {isRegistered ? 'Remove' : 'Add'}
                      </TButton>
                    </TRow>
                  )
                }
              })}
              height={460}
            />
          </TColumn>
        )}
      </TColumn>
    </TDialog>
  )
}
