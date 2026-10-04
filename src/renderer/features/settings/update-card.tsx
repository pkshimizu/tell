import { useEffect, useState } from 'react'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TText from '@renderer/components/display/text'
import TButton from '@renderer/components/form/button'
import TLinearProgress from '@renderer/components/feedback/linear-progress'
import TLink from '@renderer/components/navigation/link'
import useUpdate from '@renderer/hooks/update'
import useMessage from '@renderer/hooks/message'
import type { UnsupportedReason, UpdateStatus } from '@main/models/update'

const RELEASES_URL = 'https://github.com/pkshimizu/tell/releases'

const UNSUPPORTED_REASON_TEXT: Record<UnsupportedReason, string> = {
  development: 'Updates are disabled in development mode.',
  mas: 'Updates are delivered through the Mac App Store.',
  'local-build':
    'This build does not receive updates. Install tell from GitHub Releases to get updates.',
  'not-in-applications': 'Move tell to the Applications folder to receive updates.'
}

function statusText(status: UpdateStatus): string {
  switch (status.state) {
    case 'unsupported':
      return UNSUPPORTED_REASON_TEXT[status.reason]
    case 'idle':
      return 'Updates are checked automatically.'
    case 'checking':
      return 'Checking for updates...'
    case 'up-to-date':
      return 'tell is up to date.'
    case 'downloading':
      return `Downloading v${status.version}... ${Math.round(status.percent)}%`
    case 'ready':
      return `v${status.version} is ready. Restart tell to update, or it will be installed when you quit.`
    case 'error':
      return `Could not update: ${status.message}`
  }
}

/**
 * 設定画面（General）のアップデートカード
 */
export function UpdateCard(): JSX.Element {
  const { snapshot, check, install } = useUpdate()
  const { setMessage } = useMessage()
  const [currentVersion, setCurrentVersion] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    void window.api.app.getVersion().then(setCurrentVersion)
  }, [])

  const status = snapshot?.status
  const newVersion =
    status?.state === 'downloading' || status?.state === 'ready' ? status.version : null
  // リリースノートは本文を描画せず、GitHub の Release ページへのリンクにとどめる
  const releaseVersion = newVersion ?? currentVersion

  const handleCheck = async (): Promise<void> => {
    setChecking(true)
    try {
      const result = await check()
      if (!result.success || !result.data) {
        setMessage('error', result.error || 'Could not check for updates')
        return
      }
      const checked = result.data.status
      if (checked.state === 'up-to-date') {
        setMessage('success', 'tell is up to date.')
      } else if (checked.state === 'error') {
        setMessage('error', `Could not check for updates: ${checked.message}`)
      } else if (checked.state === 'downloading') {
        setMessage('info', `Downloading v${checked.version}...`)
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <TColumn gap={2}>
      <TText variant="subtitle">Updates</TText>
      <TText>{`Current version: v${currentVersion}`}</TText>
      {status && <TText>{statusText(status)}</TText>}
      {status?.state === 'downloading' && <TLinearProgress value={status.percent} width={320} />}
      <TRow gap={2} align="center">
        <TButton
          variant="outlined"
          onClick={() => void handleCheck()}
          disabled={!snapshot?.canCheck || checking}
          processing={checking}
        >
          Check for updates
        </TButton>
        {status?.state === 'ready' && (
          <TButton variant="contained" onClick={() => void install()}>
            Restart to update
          </TButton>
        )}
        {releaseVersion && (
          <TLink href={`${RELEASES_URL}/tag/v${releaseVersion}`}>Release notes</TLink>
        )}
      </TRow>
    </TColumn>
  )
}
