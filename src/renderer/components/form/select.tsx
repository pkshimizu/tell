import { FormControl, FormHelperText, MenuItem, Select } from '@mui/material'
import { type ReactNode } from 'react'
import {
  type Control,
  Controller,
  type FieldError,
  type FieldPath,
  type FieldValues
} from 'react-hook-form'

interface Item {
  value: string
  label: ReactNode
}

interface Props<T extends FieldValues> {
  items: Item[]
  name: FieldPath<T>
  control: Control<T>
  error?: FieldError
}

export default function TSelect<T extends FieldValues>(props: Props<T>) {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field }) => (
        <FormControl error={props.error !== undefined}>
          <Select
            variant={'outlined'}
            size="small"
            {...field}
            value={field.value ?? ''}
            onChange={(e) => {
              field.onChange(e.target.value)
            }}
          >
            <MenuItem value={''} disabled>
              選択してください
            </MenuItem>
            {props.items.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
          {props.error?.message && <FormHelperText>{props.error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
