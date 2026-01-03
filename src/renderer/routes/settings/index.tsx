import { createFileRoute } from '@tanstack/react-router'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TCard from '@renderer/components/surface/card'
import { ThemeToggle } from '@renderer/features/settings/theme-toggle'

export const Route = createFileRoute('/settings/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <TColumn gap={3} width="100%">
      <TText variant="title">一般設定</TText>
      <TCard>
        <ThemeToggle />
      </TCard>
    </TColumn>
  )
}
