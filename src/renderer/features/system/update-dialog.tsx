import TDialog from '@renderer/components/feedback/dialog'
import TText from '@renderer/components/display/text'
import TButton from '@renderer/components/form/button'
import { TRow } from '@renderer/components/layout/flex-box'
import useUpdate from '@renderer/hooks/update'

/**
 * 更新の準備ができたら「今すぐ再起動 / 後で」を尋ねるダイアログ。
 */
export default function UpdateDialog() {
  const { snapshot, install, dismiss } = useUpdate()

  const status = snapshot?.status
  if (!snapshot?.promptRestart || status?.state !== 'ready') return null

  const handleLater = (): void => {
    void dismiss(status.version)
  }

  return (
    <TDialog
      open={true}
      title="Update ready"
      size="xs"
      onClose={handleLater}
      actions={
        <TRow gap={1}>
          <TButton variant="text" onClick={handleLater}>
            Later
          </TButton>
          <TButton variant="contained" onClick={() => void install()}>
            Restart now
          </TButton>
        </TRow>
      }
    >
      <TText>
        {`tell v${status.version} has been downloaded. Restart now to update, or choose Later to install it when you quit tell.`}
      </TText>
    </TDialog>
  )
}
