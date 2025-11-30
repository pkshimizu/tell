import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import SideBar from '@renderer/features/system/side-bar'
import { TColumn } from '@renderer/components/layout/flex-box'

export const Route = createRootRoute({
  component: () => (
    <>
      <SideBar />
      <TColumn ml={20} px={2} py={2}>
        <Outlet />
      </TColumn>
      <TanStackRouterDevtools />
    </>
  )
})
