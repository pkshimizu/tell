import TGrid from '@renderer/components/layout/grid'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import TLink from '@renderer/components/navigation/link'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import { useEffect, useState } from 'react'
import { GitHubAccount } from '@renderer/types/github'
import useText from '@renderer/hooks/text'
import TButton from '@renderer/components/form/button'
import TIconButton from '@renderer/components/form/icon-button'
import GitHubRepositorySelectDialog from './repository-select-dialog'
import GitHubAccountUpdateTokenDialog from './account-update-token-dialog'
import GitHubAccountDeleteDialog from './account-delete-dialog'
import GitHubIcon from '@renderer/components/display/icons/github'
import CloseIcon from '@renderer/components/display/icons/close'
import { IoTrash } from 'react-icons/io5'

interface Props {
  accounts: GitHubAccount[]
  onAccountUpdated?: (account: GitHubAccount) => void
  onAccountDeleted?: () => void
}

interface RegisteredRepository {
  accountId: string
  ownerLogin: string
  repositoryName: string
  repositoryHtmlUrl: string
}

export default function GitHubAccountTable({
  accounts,
  onAccountUpdated,
  onAccountDeleted
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateTokenDialogOpen, setUpdateTokenDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [selectedAccountForUpdate, setSelectedAccountForUpdate] = useState<GitHubAccount | null>(
    null
  )
  const [selectedAccountForDelete, setSelectedAccountForDelete] = useState<GitHubAccount | null>(
    null
  )
  const [repositories, setRepositories] = useState<RegisteredRepository[]>([])
  const text = useText()

  const loadRepositories = async () => {
    const result = await window.api.settings.github.getAllRegisteredRepositories()
    if (result.success && result.data) {
      setRepositories(result.data)
    }
  }

  useEffect(() => {
    loadRepositories()
  }, [])

  const handleOpenDialog = (accountId: number) => {
    setSelectedAccountId(accountId)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedAccountId(null)
    loadRepositories()
  }

  const handleOpenUpdateTokenDialog = (account: GitHubAccount) => {
    setSelectedAccountForUpdate(account)
    setUpdateTokenDialogOpen(true)
  }

  const handleCloseUpdateTokenDialog = () => {
    setUpdateTokenDialogOpen(false)
    setSelectedAccountForUpdate(null)
  }

  const handleTokenUpdated = (updatedAccount: GitHubAccount) => {
    if (onAccountUpdated) {
      onAccountUpdated(updatedAccount)
    }
  }

  const handleOpenDeleteDialog = (account: GitHubAccount) => {
    setSelectedAccountForDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedAccountForDelete(null)
  }

  const handleAccountDeleted = () => {
    loadRepositories()
    if (onAccountDeleted) {
      onAccountDeleted()
    }
  }

  const getAccountRepositories = (accountId: number) => {
    return repositories.filter((repo) => repo.accountId === String(accountId))
  }

  const handleRemoveRepository = async (
    accountId: number,
    ownerLogin: string,
    repositoryName: string
  ) => {
    const result = await window.api.settings.github.removeRepository(
      accountId,
      ownerLogin,
      repositoryName
    )
    if (result.success) {
      loadRepositories()
    }
  }

  return (
    <>
      <TColumn gap={2}>
        {accounts.map((account) => (
          <TColumn key={account.id} gap={1}>
            <TGrid
              columns={['56px', '1fr', '160px', '120px', '120px', '40px']}
              gap={2}
              alignItems={'center'}
            >
              {account.avatarUrl ? (
                <TAvatar url={account.avatarUrl} alt={account.login} size={56} />
              ) : (
                <TAvatar alt={account.login} size={56} />
              )}
              <TColumn>
                <TLink href={account.htmlUrl}>
                  <TText variant="subtitle">{account.login}</TText>
                </TLink>
                {account.name && <TText>{account.name}</TText>}
              </TColumn>
              <TColumn>
                <TText>Expires date</TText>
                <TText>{text.formatDateTime(account.expiredAt) ?? 'No expires'}</TText>
              </TColumn>
              <TButton onClick={() => handleOpenUpdateTokenDialog(account)}>Update Token</TButton>
              <TButton onClick={() => handleOpenDialog(account.id)}>Repositories</TButton>
              <TIconButton onClick={() => handleOpenDeleteDialog(account)}>
                <IoTrash size={20} />
              </TIconButton>
            </TGrid>
            {getAccountRepositories(account.id).length > 0 && (
              <TColumn gap={0.5}>
                {getAccountRepositories(account.id).map((repo) => (
                  <TRow
                    key={`${repo.ownerLogin}/${repo.repositoryName}`}
                    align={'center'}
                    gap={0.5}
                  >
                    <TLink href={repo.repositoryHtmlUrl}>
                      <TRow align={'center'} gap={0.5}>
                        <GitHubIcon size={20} />
                        <TText>
                          {repo.ownerLogin}/{repo.repositoryName}
                        </TText>
                      </TRow>
                    </TLink>
                    <TIconButton
                      onClick={() =>
                        handleRemoveRepository(account.id, repo.ownerLogin, repo.repositoryName)
                      }
                    >
                      <CloseIcon size={16} />
                    </TIconButton>
                  </TRow>
                ))}
              </TColumn>
            )}
          </TColumn>
        ))}
      </TColumn>
      <GitHubRepositorySelectDialog
        open={dialogOpen}
        accountId={selectedAccountId}
        onClose={handleCloseDialog}
      />
      <GitHubAccountUpdateTokenDialog
        open={updateTokenDialogOpen}
        account={selectedAccountForUpdate}
        onClose={handleCloseUpdateTokenDialog}
        onTokenUpdated={handleTokenUpdated}
      />
      <GitHubAccountDeleteDialog
        open={deleteDialogOpen}
        account={selectedAccountForDelete}
        onClose={handleCloseDeleteDialog}
        onDeleted={handleAccountDeleted}
      />
    </>
  )
}
