import { type ChangeEvent, useCallback } from 'react'
import { Pagination } from '@mui/material'

interface Props {
  count: number
  size: number
  page: number
  onChange?: (page: number) => void
}

export default function TPagination({ count, size, page, onChange }: Props) {
  const handleChangePage = useCallback(
    (_: ChangeEvent<unknown>, p: number) => {
      if (onChange) {
        onChange(p)
      }
    },
    [onChange]
  )
  const numberOfPage = count > 0 ? Math.floor((count - 1) / size) + 1 : 0
  return <Pagination count={numberOfPage} page={page} onChange={handleChangePage} />
}
