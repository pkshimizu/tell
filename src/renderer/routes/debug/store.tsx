import { createFileRoute } from '@tanstack/react-router'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import DebugStoreViewer from '@renderer/features/debug/store-viewer'

export const Route = createFileRoute('/debug/store')({
  component: RouteComponent
})

function RouteComponent() {
  // 開発モードでない場合は何も表示しない
  if (process.env.NODE_ENV !== 'development') {
    return (
      <TColumn gap={2} fullWidth>
        <TText variant="title">Access Denied</TText>
        <TText>This feature is only available in development mode.</TText>
      </TColumn>
    )
  }

  return (
    <TColumn gap={2} fullWidth>
      <TText variant="title">Debug Store Viewer</TText>
      <DebugStoreViewer />
    </TColumn>
  )
}
