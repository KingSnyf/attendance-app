"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  pageSize?: number
  className?: string
}

export function DataTable<T>({ columns, data, pageSize = 10, className }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className={cn("space-y-4", className)}>
      <TableWrapper className="border-0">
        <Table>
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(header.column.getCanSort() && "cursor-pointer select-none")}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <>
                          {header.column.getIsSorted() === "asc" && <ChevronUp className="size-3" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown className="size-3" />}
                          {!header.column.getIsSorted() && <ChevronsUpDown className="size-3 text-muted-foreground/50" />}
                        </>
                      )}
                    </div>
                  </TableHeadCell>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border transition-colors hover:bg-muted/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-muted-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {table.getState().pagination.pageIndex * pageSize + 1}–
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} sur {data.length}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
