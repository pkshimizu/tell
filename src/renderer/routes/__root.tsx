import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import SideBar from '@renderer/features/system/side-bar'
import { TColumn } from '@renderer/components/layout/flex-box'
import SystemMessage from '@renderer/features/system/message'
import UpdateDialog from '@renderer/features/system/update-dialog'
import { useUpdateSubscription } from '@renderer/hooks/update'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent() {
  // サイドバー・設定画面・ダイアログが使う更新状態を、アプリ全体で 1 回だけ購読する
  useUpdateSubscription()

  return (
    <>
      <SideBar />
      <TColumn ml={8} px={2} py={2}>
        <Outlet />
      </TColumn>
      <SystemMessage />
      <UpdateDialog />
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </>
  )
}
