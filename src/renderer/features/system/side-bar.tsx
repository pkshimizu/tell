import { useEffect, useState, useMemo } from 'react'
import TDrawer from '@renderer/components/navigation/drawer'
import TList from '@renderer/components/display/list'
import TText from '@renderer/components/display/text'
import { TColumn } from '@renderer/components/layout/flex-box'
import HomeIcon from '@renderer/components/display/icons/home'
import SettingsIcon from '@renderer/components/display/icons/settings'
import BugIcon from '@renderer/components/display/icons/bug'
import { useLocation } from '@tanstack/react-router'

export default function SideBar() {
  const location = useLocation()
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    const fetchVersion = async () => {
      const appVersion = await window.api.app.getVersion()
      setVersion(appVersion)
    }
    void fetchVersion()
  }, [])

  const menuItems = useMemo(() => {
    const pathname = location.pathname

    const items = [
      {
        id: 'home',
        icon: <HomeIcon />,
        selected: pathname === '/',
        href: '/',
        tooltip: 'Home'
      },
      {
        id: 'setting',
        icon: <SettingsIcon />,
        selected: pathname.startsWith('/settings'),
        href: '/settings',
        tooltip: 'Settings'
      }
    ]

    // 開発モードの場合のみデバッグメニューを追加
    if (process.env.NODE_ENV === 'development') {
      items.push({
        id: 'debug',
        icon: <BugIcon />,
        selected: pathname.startsWith('/debug'),
        href: '/debug/store',
        tooltip: 'Debug Store'
      })
    }

    return items
  }, [location.pathname])

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
