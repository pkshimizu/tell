import TDrawer from '@renderer/components/navigation/drawer'
import TList from '@renderer/components/display/list'
import HomeIcon from '@renderer/components/display/icons/home'
import SettingsIcon from '@renderer/components/display/icons/settings'
import { useMatchRoute } from '@tanstack/react-router'

export default function SideBar() {
  const matchRoute = useMatchRoute()

  return (
    <TDrawer open={true} variant={'permanent'} width={160}>
      <TList
        items={[
          {
            id: 'home',
            text: 'Home',
            icon: <HomeIcon />,
            selected: matchRoute({ to: '/', fuzzy: true }) as boolean,
            href: '/'
          },
          {
            id: 'setting',
            text: 'Settings',
            icon: <SettingsIcon />,
            selected: matchRoute({ to: '/settings', fuzzy: true }) as boolean,
            href: '/settings'
          }
        ]}
      />
    </TDrawer>
  )
}
