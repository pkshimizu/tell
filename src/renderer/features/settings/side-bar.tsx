import TList from '@renderer/components/display/list'
import SettingsIcon from '@renderer/components/display/icons/settings'
import { useMatchRoute } from '@tanstack/react-router'
import GitHubIcon from '@renderer/components/display/icons/github'

export default function SettingsSideBar() {
  const matchRoute = useMatchRoute()

  return (
    <TList
      items={[
        {
          id: 'general',
          text: 'General',
          icon: <SettingsIcon />,
          selected: matchRoute({ to: '/settings', fuzzy: false }) as boolean,
          href: '/settings'
        },
        {
          id: 'github',
          text: 'GitHub',
          icon: <GitHubIcon />,
          selected: matchRoute({ to: '/settings/github', fuzzy: true }) as boolean,
          href: '/settings/github'
        }
      ]}
    />
  )
}
