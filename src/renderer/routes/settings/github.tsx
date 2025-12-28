import { createFileRoute } from '@tanstack/react-router'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import GitHubAccountCreateForm from '@renderer/features/settings/github/account-create-form'
import GitHubAccountTable from '@renderer/features/settings/github/account-table'
import { useEffect, useState } from 'react'
import { GitHubAccount } from '@renderer/types/github'

export const Route = createFileRoute('/settings/github')({
  component: RouteComponent
})

function RouteComponent() {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([])

  // 初回読み込み
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    const result = await window.api.settings.github.getAccounts()
    if (result.success && result.data) {
      setAccounts(result.data)
    }
  }

  const handleAccountAdded = (account: GitHubAccount) => {
    // 新しいアカウントを既存のリストに追加
    setAccounts((prev) => [...prev, account])
  }

  return (
    <TColumn gap={2} fullWidth>
      <TText variant="title">GitHub Settings</TText>
      <GitHubAccountCreateForm onAccountAdded={handleAccountAdded} />
      <GitHubAccountTable accounts={accounts} />
    </TColumn>
  )
}
