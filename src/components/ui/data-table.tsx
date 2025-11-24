"use client"

import * as React from "react"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Column {
  name: string
  display_name: string
  type: 'text' | 'currency' | 'percentage' | 'number'
}

interface DataTableProps {
  columns: Column[]
  data: Record<string, any>[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  loading?: boolean
  className?: string
}

function formatCellValue(value: any, type: string): string {
  if (value === null || value === undefined) {
    return '-'
  }

  switch (type) {
    case 'currency':
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(numValue)) return '-'
      const absValue = Math.abs(numValue)
      const sign = numValue < 0 ? '-' : ''
      if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'b'
      if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'm'
      if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'k'
      return sign + '$' + absValue.toFixed(0)
    
    case 'percentage':
      const percentValue = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(percentValue)) return '-'
      return percentValue.toFixed(2) + '%'
    
    case 'number':
      const numberValue = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(numberValue)) return '-'
      return numberValue.toLocaleString()
    
    default:
      return String(value)
  }
}

export function DataTable({
  columns,
  data,
  pagination,
  onPageChange,
  loading = false,
  className
}: DataTableProps) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnName)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const renderPagination = () => {
    if (!pagination || !onPageChange) return null

    const { page, totalPages } = pagination
    const pages = []
    
    // Show max 5 page buttons
    let startPage = Math.max(1, page - 2)
    let endPage = Math.min(totalPages, startPage + 4)
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            {'<'}
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border",
                pageNum === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {pageNum}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            {'>'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                >
                  <button
                    onClick={() => handleSort(column.name)}
                    className="flex items-center gap-2 font-medium hover:text-foreground"
                  >
                    {column.display_name}
                    {sortColumn === column.name && (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {columns.map((column) => (
                  <td
                    key={column.name}
                    className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                  >
                    {formatCellValue(row[column.name], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  )
}