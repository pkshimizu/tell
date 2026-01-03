import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { TColumn } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TBox from '@renderer/components/display/box'
import TRadioGroup from '@renderer/components/form/radio-group'
import { useTheme } from '@renderer/hooks/use-theme'
import type { ThemeMode } from '@renderer/types/theme'

interface FormData {
  themeMode: number
}

// テーマモードと数値のマッピング
const THEME_MODE_MAP: Record<ThemeMode, number> = {
  light: 0,
  dark: 1,
  system: 2
}

const THEME_MODE_REVERSE_MAP: Record<number, ThemeMode> = {
  0: 'light',
  1: 'dark',
  2: 'system'
}

/**
 * テーマ切り替えコンポーネント
 */
export function ThemeToggle(): JSX.Element {
  const { mode, setMode } = useTheme()

  const { control, setValue } = useForm<FormData>({
    defaultValues: {
      themeMode: THEME_MODE_MAP[mode]
    }
  })

  // フォームの値を監視して、変更時にテーマを更新
  const themeModeValue = useWatch({
    control,
    name: 'themeMode'
  })

  useEffect(() => {
    const newMode = THEME_MODE_REVERSE_MAP[themeModeValue]
    if (newMode && newMode !== mode) {
      setMode(newMode)
    }
  }, [themeModeValue, mode, setMode])

  // 現在のモードが変更されたらフォームの値を更新
  useEffect(() => {
    setValue('themeMode', THEME_MODE_MAP[mode])
  }, [mode, setValue])

  const items = [
    { value: 0, label: 'Light Mode' },
    { value: 1, label: 'Dark Mode' },
    { value: 2, label: 'System' }
  ]

  const getHelpText = (): string => {
    switch (mode) {
      case 'system':
        return 'Automatically switch theme based on system settings'
      case 'light':
        return 'Use light theme with bright background'
      case 'dark':
        return 'Use dark theme with dark background'
      default:
        return ''
    }
  }

  return (
    <TColumn gap={2}>
      <TText variant="subtitle">Theme Settings</TText>
      <TRadioGroup name="themeMode" control={control} items={items} row={false} />
      <TBox>
        <TText>{getHelpText()}</TText>
      </TBox>
    </TColumn>
  )
}
