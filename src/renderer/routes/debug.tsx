import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TColumn } from '@renderer/components/layout/flex-box'

export const Route = createFileRoute('/debug')({
  component: RouteComponent
})

function RouteComponent() {
  // 開発モードでない場合は何も表示しない
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <TColumn gap={2} fullWidth>
      <Outlet />
    </TColumn>
  )
}
