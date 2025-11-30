import { createFileRoute, Outlet } from '@tanstack/react-router'
import SettingsSideBar from '@renderer/features/settings/side-bar'
import { TRow } from '@renderer/components/layout/flex-box'

export const Route = createFileRoute('/settings')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <TRow gap={2}>
      <SettingsSideBar />
      <Outlet />
    </TRow>
  )
}
