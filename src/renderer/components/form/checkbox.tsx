import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import {
  type Control,
  Controller,
  type FieldError,
  type FieldPath,
  type FieldValues
} from 'react-hook-form'
import { FormControl, FormHelperText } from '@mui/material'

interface Props<T extends FieldValues> {
  label?: string
  name: FieldPath<T>
  control: Control<T>
  disabled?: boolean
  error?: FieldError
}

export default function TCheckbox<T extends FieldValues>({
  label,
  name,
  control,
  disabled,
  error
}: Props<T>) {
  return (
    <FormControl error={error !== undefined}>
      <FormControlLabel
        control={
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Checkbox
                {...field}
                checked={field.value}
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        }
        label={label ?? ''}
      />
      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  )
}
