import { useEffect, useState } from 'react'
import TDrawer from '@renderer/components/navigation/drawer'
import TList from '@renderer/components/display/list'
import TText from '@renderer/components/display/text'
import { TColumn } from '@renderer/components/layout/flex-box'
import HomeIcon from '@renderer/components/display/icons/home'
import SettingsIcon from '@renderer/components/display/icons/settings'
import { useMatchRoute } from '@tanstack/react-router'

export default function SideBar() {
  const matchRoute = useMatchRoute()
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    const fetchVersion = async () => {
      const appVersion = await window.api.app.getVersion()
      setVersion(appVersion)
    }
    void fetchVersion()
  }, [])

  return (
    <TDrawer open={true} variant={'permanent'} width={160}>
      <TColumn height="100%" justify="space-between">
        <TList
          items={[
            {
              id: 'home',
              content: 'Home',
              icon: <HomeIcon />,
              selected: matchRoute({ to: '/', fuzzy: true }) as boolean,
              href: '/'
            },
            {
              id: 'setting',
              content: 'Settings',
              icon: <SettingsIcon />,
              selected: matchRoute({ to: '/settings', fuzzy: true }) as boolean,
              href: '/settings'
            }
          ]}
        />
        <TColumn pa={2}>
          <TText variant="caption">v{version}</TText>
        </TColumn>
      </TColumn>
    </TDrawer>
  )
}
