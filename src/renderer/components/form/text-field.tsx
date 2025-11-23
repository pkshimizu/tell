import { InputAdornment, TextField } from '@mui/material'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import type { ReactNode } from 'react'

interface Props {
  type?: 'text' | 'password' | 'email' | 'date' | 'datetime' | 'number'
  readonly?: boolean
  fullWidth?: boolean
  register: UseFormRegisterReturn
  error?: FieldError
  placeholder?: string
  prefix?: ReactNode
  suffix?: ReactNode
  multiline?: boolean
  rows?: number
  disabled?: boolean
}

export default function TTextField(props: Props) {
  return (
    <TextField
      variant="outlined"
      size="small"
      type={props.type}
      slotProps={{
        htmlInput: {
          readOnly: props.readonly
        },
        input: {
          startAdornment: props.prefix && (
            <InputAdornment position="start">{props.prefix}</InputAdornment>
          ),
          endAdornment: props.suffix && (
            <InputAdornment position="end">{props.suffix}</InputAdornment>
          )
        }
      }}
      fullWidth={props.fullWidth}
      placeholder={props.placeholder}
      multiline={props.multiline}
      rows={props.rows}
      error={props.error !== undefined}
      helperText={props.error?.message}
      disabled={props.disabled}
      {...props.register}
    />
  )
}
