import type { ReactNode } from 'react'
import TText from '@renderer/components/display/text'
import TChip from '@renderer/components/display/chip'
import { TColumn, TRow } from '@renderer/components/layout/flex-box'

interface Props {
  label: string
  optional?: boolean
  children: ReactNode
}

export default function TFormItem(props: Props) {
  return (
    <TColumn gap={0.5}>
      <TRow align={'baseline'} gap={0.5}>
        <TText variant={'caption'}>{props.label}</TText>
        {props.optional && <TChip label={'optional'} size={'small'} variant={'outlined'} />}
      </TRow>
      {props.children}
    </TColumn>
  )
}
