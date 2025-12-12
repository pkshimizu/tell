import TDialog from '@renderer/components/feedback/dialog'

interface Props {
  open: boolean
  onClose: () => void
}

export default function GitHubRepositorySelectDialog(props: Props) {
  return (
    <TDialog open={props.open} onClose={props.onClose} title="Select Repository" size="md">
      <div>{/* TODO: 実装予定 */}</div>
    </TDialog>
  )
}
