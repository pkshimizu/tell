import { useEffect, useState, useMemo } from 'react'
import TDrawer from '@renderer/components/navigation/drawer'
import TList from '@renderer/components/display/list'
import TText from '@renderer/components/display/text'
import { TColumn } from '@renderer/components/layout/flex-box'
import HomeIcon from '@renderer/components/display/icons/home'
import SettingsIcon from '@renderer/components/display/icons/settings'
import BugIcon from '@renderer/components/display/icons/bug'
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

  const menuItems = useMemo(() => {
    const items = [
      {
        id: 'home',
        icon: <HomeIcon />,
        selected: matchRoute({ to: '/', fuzzy: true }) as boolean,
        href: '/',
        tooltip: 'Home'
      },
      {
        id: 'setting',
        icon: <SettingsIcon />,
        selected: matchRoute({ to: '/settings', fuzzy: true }) as boolean,
        href: '/settings',
        tooltip: 'Settings'
      }
    ]

    // 開発モードの場合のみデバッグメニューを追加
    if (process.env.NODE_ENV === 'development') {
      items.push({
        id: 'debug',
        icon: <BugIcon />,
        selected: matchRoute({ to: '/debug/store', fuzzy: true }) as boolean,
        href: '/debug/store',
        tooltip: 'Debug Store'
      })
    }

    return items
  }, [matchRoute])

  return (
    <TDrawer open={true} variant={'permanent'} width={64}>
      <TColumn height="100%" justify="space-between">
        <TList items={menuItems} />
        <TColumn pa={2}>
          <TText variant="caption">v{version}</TText>
        </TColumn>
      </TColumn>
    </TDrawer>
  )
}
