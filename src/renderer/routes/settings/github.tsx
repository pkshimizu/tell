import { createFileRoute } from '@tanstack/react-router'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import GitHubAccountCreateForm from '@renderer/features/settings/github/account-create-form'
import GitHubAccountTable from '@renderer/features/settings/github/account-table'

export const Route = createFileRoute('/settings/github')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <TColumn gap={2} fullWidth>
      <TText variant="title">GitHub Settings</TText>
      <GitHubAccountCreateForm />
      <GitHubAccountTable />
    </TColumn>
  )
}
