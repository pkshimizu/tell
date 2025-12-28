import { useState, useEffect } from 'react'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'
import TButton from '@renderer/components/form/button'
import TText from '@renderer/components/display/text'
import TCard from '@renderer/components/surface/card'
import useMessage from '@renderer/hooks/message'
import TBox from '@renderer/components/display/box'

export default function DebugStoreViewer() {
  const [storeData, setStoreData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const message = useMessage()

  // ストアデータを取得
  const loadStoreData = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.debug.store.getAll()
      if (result.success && result.data) {
        setStoreData(result.data)
      } else {
        message.setMessage('error', result.error || 'Failed to load store data')
      }
    } catch (error) {
      message.setMessage('error', 'Failed to load store data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // config.jsonをエディタで開く
  const handleOpenConfig = async () => {
    try {
      const result = await window.api.debug.store.openConfig()
      if (!result.success) {
        message.setMessage('error', result.error || 'Failed to open config.json')
      }
    } catch (error) {
      message.setMessage('error', 'Failed to open config.json')
      console.error(error)
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadStoreData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TColumn gap={2} fullWidth>
      {/* ツールバー */}
      <TCard>
        <TRow gap={2}>
          <TButton onClick={loadStoreData} disabled={isLoading} variant="outlined">
            Reload
          </TButton>
          <TButton onClick={handleOpenConfig} variant="outlined">
            Open config.json
          </TButton>
        </TRow>
      </TCard>

      {/* データ表示エリア */}
      <TCard>
        <TColumn gap={2} fullWidth>
          <TText variant="subtitle">Store Data</TText>
          {isLoading ? (
            <TText>Loading...</TText>
          ) : (
            <TBox backgroundColor={'boxBackground'} padding={2}>
              <TText whiteSpace={'pre'}>{storeData ?? ''}</TText>
            </TBox>
          )}
        </TColumn>
      </TCard>

      {/* 使用方法 */}
      <TCard>
        <TColumn gap={1}>
          <TText variant="subtitle">Usage</TText>
          <TText variant="caption">• Press Cmd/Ctrl+Shift+D to open this window</TText>
          <TText variant="caption">• Click &quot;Reload&quot; to refresh the store data</TText>
          <TText variant="caption">
            • Click &quot;Open config.json&quot; to edit the store file directly
          </TText>
        </TColumn>
      </TCard>
    </TColumn>
  )
}
