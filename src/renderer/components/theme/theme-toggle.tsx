import { useTheme } from '@renderer/contexts/theme-context'
import TIconButton from '@renderer/components/form/icon-button'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import { MdDarkMode, MdLightMode, MdComputer } from 'react-icons/md'

export default function ThemeToggle() {
  const { mode, setMode, currentTheme } = useTheme()

  const handleThemeChange = () => {
    if (mode === 'light') {
      setMode('dark')
    } else if (mode === 'dark') {
      setMode('system')
    } else {
      setMode('light')
    }
  }

  const getIcon = () => {
    if (mode === 'light') return <MdLightMode size={20} />
    if (mode === 'dark') return <MdDarkMode size={20} />
    return <MdComputer size={20} />
  }

  const getTooltip = () => {
    if (mode === 'light') return 'Light Mode'
    if (mode === 'dark') return 'Dark Mode'
    return `System (${currentTheme === 'dark' ? 'Dark' : 'Light'})`
  }

  return (
    <TColumn gap={1} align="center">
      <TIconButton onClick={handleThemeChange} tooltip={getTooltip()}>
        {getIcon()}
      </TIconButton>
      <TText variant="caption">{getTooltip()}</TText>
    </TColumn>
  )
}