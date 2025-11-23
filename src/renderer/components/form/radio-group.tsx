import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import {
  type Control,
  Controller,
  type FieldError,
  type FieldPath,
  type FieldValues
} from 'react-hook-form'
import type { ReactNode } from 'react'
import { FormControl, FormHelperText, Radio } from '@mui/material'

interface RadioItem {
  value: number
  label: ReactNode
}

interface Props<T extends FieldValues> {
  items: RadioItem[]
  row?: boolean
  name: FieldPath<T>
  fontSize?: number
  control: Control<T>
  disabled?: boolean
  error?: FieldError
}

export default function TRadioGroup<T extends FieldValues>({
  items,
  row = false,
  name,
  fontSize,
  control,
  disabled,
  error
}: Props<T>) {
  return (
    <Controller<T>
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl error={error !== undefined}>
          <RadioGroup row={row} {...field} value={field.value ?? ''}>
            {items.map((item) => (
              <FormControlLabel
                key={item.value}
                control={
                  <Radio
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize
                      }
                    }}
                  />
                }
                value={item.value}
                label={item.label}
                disabled={disabled}
                sx={{
                  fontSize
                }}
              />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
