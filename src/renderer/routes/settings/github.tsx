import { createFileRoute } from '@tanstack/react-router'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TSelect from '@renderer/components/form/select'
import GitHubAccountCreateForm from '@renderer/features/settings/github/account-create-form'
import GitHubAccountTable from '@renderer/features/settings/github/account-table'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GitHubAccount } from '@renderer/types/github'

type ReloadInterval = 1 | 3 | 5 | 10 | 15

interface SettingsFormData {
  reloadInterval: string
}

export const Route = createFileRoute('/settings/github')({
  component: RouteComponent
})

function RouteComponent() {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([])
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'author'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { control, watch, setValue } = useForm<SettingsFormData>({
    defaultValues: {
      reloadInterval: '5'
    }
  })

  const reloadInterval = watch('reloadInterval')

  const reloadIntervalItems = [
    { value: '1', label: '1 min' },
    { value: '3', label: '3 min' },
    { value: '5', label: '5 min' },
    { value: '10', label: '10 min' },
    { value: '15', label: '15 min' }
  ]

  // 初回読み込み
  useEffect(() => {
    const loadAccounts = async () => {
      const result = await window.api.settings.github.getAccounts()
      if (result.success && result.data) {
        setAccounts(result.data)
      }
    }

    const loadPullRequestsSettings = async () => {
      const result = await window.api.settings.pullRequests.get()
      if (result.success && result.data) {
        setSortBy(result.data.sortBy)
        setSortOrder(result.data.sortOrder)
        const interval = result.data.reloadInterval ?? 5
        setValue('reloadInterval', String(interval))
      }
      setIsSettingsLoaded(true)
    }

    loadAccounts()
    loadPullRequestsSettings()
  }, [setValue])

  // リロード間隔の保存
  useEffect(() => {
    if (!isSettingsLoaded) return
    ;(async () => {
      const interval = Number(reloadInterval) as ReloadInterval
      await window.api.settings.pullRequests.set(sortBy, sortOrder, interval)
    })()
  }, [reloadInterval, isSettingsLoaded, sortBy, sortOrder])

  const handleAccountAdded = (account: GitHubAccount) => {
    // 新しいアカウントを既存のリストに追加
    setAccounts((prev) => [...prev, account])
  }

  const handleAccountUpdated = (updatedAccount: GitHubAccount) => {
    // アカウント情報を更新
    setAccounts((prev) =>
      prev.map((account) => (account.id === updatedAccount.id ? updatedAccount : account))
    )
  }

  const handleAccountDeleted = async () => {
    // アカウント一覧を再読み込み
    const result = await window.api.settings.github.getAccounts()
    if (result.success && result.data) {
      setAccounts(result.data)
    }
  }

  return (
    <TColumn gap={2} fullWidth>
      <TText variant="title">GitHub Settings</TText>
      <TRow align="center" gap={1}>
        <TText>Pull Request Reload Interval:</TText>
        <TSelect name="reloadInterval" control={control} items={reloadIntervalItems} />
      </TRow>
      <GitHubAccountCreateForm onAccountAdded={handleAccountAdded} />
      <GitHubAccountTable
        accounts={accounts}
        onAccountUpdated={handleAccountUpdated}
        onAccountDeleted={handleAccountDeleted}
      />
    </TColumn>
  )
}
