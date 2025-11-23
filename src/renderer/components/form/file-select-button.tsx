import { Button, styled } from '@mui/material'
import { type ChangeEvent, type ReactNode, useCallback } from 'react'

interface Props {
  id: string
  accepts: string[]
  multiple?: boolean
  disabled?: boolean
  maxSize?: number
  children: ReactNode
  onSelect: (files: File[]) => void
  onError?: () => void
}

const StyledInput = styled('input')({})

export default function TFileSelectButton({
  id,
  accepts,
  multiple = false,
  disabled = false,
  maxSize,
  children,
  onSelect,
  onError
}: Props) {
  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        const array: File[] = []
        const list: FileList = event.target.files
        for (let index = 0; index < list.length; index += 1) {
          const file = list.item(index)
          if (file) {
            array.push(file)
          }
        }
        onSelect(array)
        event.target.value = ''
      }
    },
    [onSelect]
  )
  return (
    <label htmlFor={id}>
      <StyledInput
        sx={{ display: 'none' }}
        accept={accepts.join(',')}
        type="file"
        id={id}
        name="file-select-button"
        multiple={multiple}
        size={maxSize}
        disabled={disabled}
        onChange={handleSelect}
        onError={onError}
      />
      <Button variant="contained" component="span" disabled={disabled}>
        {children}
      </Button>
    </label>
  )
}
