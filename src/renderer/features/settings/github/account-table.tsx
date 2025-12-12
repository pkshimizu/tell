import TGrid from '@renderer/components/layout/grid'
import TAvatar from '@renderer/components/display/avatar'
import TText from '@renderer/components/display/text'
import TLink from '@renderer/components/navigation/link'
import { TColumn } from '@renderer/components/layout/flex-box'
import { useEffect, useState } from 'react'
import { GitHubAccount } from '@renderer/types/github'
import useText from '@renderer/hooks/text'
import TButton from '@renderer/components/form/button'
import GitHubRepositorySelectDialog from './repository-select-dialog'

export default function GitHubAccountTable() {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const text = useText()

  useEffect(() => {
    ;(async () => {
      const result = await window.api.github.getAccounts()
      if (result.success && result.data) {
        setAccounts(result.data)
      }
    })()
  }, [])

  const handleOpenDialog = () => {
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  return (
    <>
      <TColumn>
        {accounts.map((account) => (
          <TGrid
            key={account.id}
            columns={['56px', '1fr', '160px', '120px']}
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
            <TButton onClick={handleOpenDialog}>Repositories</TButton>
          </TGrid>
        ))}
      </TColumn>
      <GitHubRepositorySelectDialog open={dialogOpen} onClose={handleCloseDialog} />
    </>
  )
}
