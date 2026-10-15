import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataGridColumn<TData> {
  id: string
  header: string
  accessor: (row: TData) => ReactNode
  sortable?: boolean
  sortValue?: (row: TData) => string | number
}

export interface DataGridProps<TData> {
  data: TData[]
  columns: DataGridColumn<TData>[]
  className?: string
  emptyMessage?: string
  getRowId: (row: TData) => string
}

type SortDirection = 'asc' | 'desc' | null

export function DataGrid<TData>({
  data,
  columns,
  className,
  emptyMessage = 'No results.',
  getRowId,
}: DataGridProps<TData>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    const column = columns.find((col) => col.id === sortColumn)
    if (!column?.sortValue) return data

    return [...data].sort((a, b) => {
      const aVal = column.sortValue!(a)
      const bVal = column.sortValue!(b)
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [columns, data, sortColumn, sortDirection])

  const toggleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable) return

    if (sortColumn !== columnId) {
      setSortColumn(columnId)
      setSortDirection('asc')
      return
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc')
      return
    }

    setSortColumn(null)
    setSortDirection(null)
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort(column.id, column.sortable)}
                  >
                    {column.header}
                    {sortColumn === column.id && sortDirection === 'asc' && (
                      <ArrowUp className="ml-1 size-3.5" />
                    )}
                    {sortColumn === column.id && sortDirection === 'desc' && (
                      <ArrowDown className="ml-1 size-3.5" />
                    )}
                    {sortColumn !== column.id && <ArrowUpDown className="ml-1 size-3.5 opacity-50" />}
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length ? (
            sortedData.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.accessor(row)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
