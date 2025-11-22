import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { ReactNode } from 'react'

interface Column {
  name: string
  cell?: ReactNode
  align?: 'left' | 'center' | 'right'
  width?: number
}

interface Row {
  id: string
  cells: { [key: string]: ReactNode }
}

interface Props {
  columns: Column[]
  rows: Row[]
}

function TTableRow({ columns, row }: { columns: Column[]; row: Row }) {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell key={column.name} width={column.width} align={column.align}>
          {row.cells[column.name]}
        </TableCell>
      ))}
    </TableRow>
  )
}

export default function TTable({ columns, rows }: Props) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.name} width={column.width} align={column.align}>
                {column.cell}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TTableRow key={row.id} columns={columns} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
