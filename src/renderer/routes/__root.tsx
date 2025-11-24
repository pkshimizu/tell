import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import SideBar from '@renderer/features/system/side-bar'

export const Route = createRootRoute({
  component: () => (
    <>
      <SideBar />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
})
