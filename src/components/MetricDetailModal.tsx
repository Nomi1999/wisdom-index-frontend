"use client"

import * as React from "react"
import { InfoIcon, TableIcon, Loader2Icon, XIcon, CalculatorIcon, FileTextIcon, DatabaseIcon, TagIcon } from "lucide-react"
import { buildApiUrl } from "@/lib/api"
import { getAuthToken } from "@/utils/sessionAuth"

interface MetricDetail {
  metric_name: string
  category: string
  value: number | null
  formatted_value: string
  formula: string
  description: string
  tables: string[]
}

interface TableData {
  columns: Array<{
    name: string
    display_name: string
    type: 'text' | 'currency' | 'percentage' | 'number'
  }>
  data: Record<string, string | number | boolean | null>[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface MetricDetailModalProps {
  isOpen: boolean
  onClose: () => void
  metricName: string
  categoryName: string
}

export function MetricDetailModal({
  isOpen,
  onClose,
  metricName,
}: MetricDetailModalProps) {
  const [metricDetail, setMetricDetail] = React.useState<MetricDetail | null>(null)
  const [tableData, setTableData] = React.useState<Record<string, TableData>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("overview")
  const [closing, setClosing] = React.useState(false)

  const fetchMetricDetails = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get JWT token from session storage
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Fetch metric details
      const detailsResponse = await fetch(
        buildApiUrl(`/api/metrics/${metricName}/details`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch metric details')
      }

      const detailsData = await detailsResponse.json()
      
      // Ensure tables is an array
      if (!detailsData.tables || !Array.isArray(detailsData.tables)) {
        detailsData.tables = []
      }
      
      setMetricDetail(detailsData)

      // Fetch data for each table
      const tableDataPromises = detailsData.tables.map(async (tableName: string) => {
        const dataResponse = await fetch(
          buildApiUrl(`/api/data/${tableName}?page=1&limit=10`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!dataResponse.ok) {
          throw new Error(`Failed to fetch data for table: ${tableName}`)
        }

        return { tableName, data: await dataResponse.json() }
      })

      const tableResults = await Promise.all(tableDataPromises)
      const newTableData: Record<string, TableData> = {}
      
      tableResults.forEach(({ tableName, data }) => {
        newTableData[tableName] = data
      })

      setTableData(newTableData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [metricName])

  // Fetch metric details when modal opens
  React.useEffect(() => {
    if (isOpen && metricName) {
      setClosing(false)
      fetchMetricDetails()
    }
  }, [isOpen, metricName, fetchMetricDetails])

  const handleTablePageChange = async (tableName: string, page: number) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        buildApiUrl(`/api/data/${tableName}?page=${page}&limit=10`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch data for table: ${tableName}`)
      }

      const data = await response.json()
      setTableData(prev => ({
        ...prev,
        [tableName]: data
      }))
    } catch (err) {
      console.error('Error fetching table data:', err)
    }
  }

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
      setActiveTab("overview")
      setMetricDetail(null)
      setTableData({})
    }, 300)
  }

  const formatFullValue = (value: number | null, category: string): string => {
    if (value === null || value === undefined) {
      return '-'
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '-'

    if (category === 'planning' || category === 'wisdom-index') {
      // Ratio formatting - show full decimal places
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    } else {
      // Currency formatting - show full amount with commas
      const absValue = Math.abs(numValue)
      const sign = numValue < 0 ? '-' : ''
      return sign + '$' + absValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }

  const formatCellValue = (value: string | number | boolean | null | undefined, type: string): string => {
    if (value === null || value === undefined) {
      return '-'
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
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

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] transition-all duration-300 bg-gray-900/50 backdrop-blur-sm ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className={`w-[95%] max-w-[1100px] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 border border-gray-100 ${
        closing ? 'scale-95 translate-y-4 opacity-0' : 'scale-100 translate-y-0 opacity-100'
      }`}>
        {/* Header */}
        <header className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <CalculatorIcon size={20} />
            </div>
            <h1 className="m-0 text-gray-900 text-xl font-semibold tracking-tight">
              {metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label="Close"
            onClick={handleClose}
          >
            <XIcon size={20} />
          </button>
        </header>
        
        {/* Main Content */}
        <main className="overflow-hidden flex-1 min-h-0 flex flex-col bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
              <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <InfoIcon className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <button
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                onClick={fetchMetricDetails}
              >
                Try Again
              </button>
            </div>
          ) : metricDetail ? (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Tab Navigation */}
              <div className="px-8 py-4 bg-white border-b border-gray-100">
                <div className="flex p-1 bg-gray-100/80 rounded-lg w-fit">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'overview'
                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <InfoIcon size={16} className={activeTab === 'overview' ? 'text-blue-600' : 'text-gray-400'} />
                    <span>Overview</span>
                  </button>
                  {metricDetail.tables.map((tableName) => (
                    <button
                      key={tableName}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                        activeTab === tableName
                          ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                      }`}
                      onClick={() => setActiveTab(tableName)}
                    >
                      <TableIcon size={16} className={activeTab === tableName ? 'text-blue-600' : 'text-gray-400'} />
                      <span>
                        {tableName.replace(/_/g, ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Main Value Card - Spans full width on mobile, 1 col on large */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                         <CalculatorIcon size={120} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Current Value</h3>
                        <div className="text-5xl sm:text-6xl font-bold tracking-tight mb-2">
                          {formatFullValue(metricDetail.value, metricDetail.category)}
                        </div>
                        <p className="text-blue-200 text-sm font-medium opacity-80">
                          Calculated live from {metricDetail.tables.length} source table{metricDetail.tables.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Formula Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                          <CalculatorIcon size={16} />
                        </div>
                        <h3 className="text-gray-900 font-semibold">Calculation Formula</h3>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-sm text-gray-700 leading-relaxed break-all">
                        {metricDetail.formula}
                      </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                          <FileTextIcon size={16} />
                        </div>
                        <h3 className="text-gray-900 font-semibold">Description</h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed flex-1">
                        {metricDetail.description}
                      </p>
                    </div>

                    {/* Metadata Row */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white px-5 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <TagIcon size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Category</p>
                          <p className="text-gray-900 font-medium capitalize">{metricDetail.category.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="bg-white px-5 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <DatabaseIcon size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Data Sources</p>
                          <p className="text-gray-900 font-medium">{metricDetail.tables.join(', ').replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {metricDetail.tables.map((tableName) => {
                  if (activeTab !== tableName) return null
                  
                  const data = tableData[tableName]
                  
                  return (
                    <div key={tableName} className="animate-in fade-in duration-200">
                      {data ? (
                        <div className="flex flex-col gap-4">
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-gray-50/80 border-b border-gray-200">
                                    {data.columns.map((column) => (
                                      <th key={column.name} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        {column.display_name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {data.data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                      {data.columns.map((column) => (
                                        <td key={column.name} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                          {formatCellValue(row[column.name], column.type)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Pagination */}
                            {data.pagination && data.pagination.totalPages > 1 && (
                              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  Showing <span className="font-medium text-gray-900">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> to{' '}
                                  <span className="font-medium text-gray-900">{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}</span> of{' '}
                                  <span className="font-medium text-gray-900">{data.pagination.total}</span> results
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTablePageChange(tableName, data.pagination!.page - 1)}
                                    disabled={data.pagination.page === 1}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                  >
                                    Previous
                                  </button>
                                  <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                                    {data.pagination.page} / {data.pagination.totalPages}
                                  </span>
                                  <button
                                    onClick={() => handleTablePageChange(tableName, data.pagination!.page + 1)}
                                    disabled={data.pagination.page === data.pagination.totalPages}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Loader2Icon className="w-8 h-8 animate-spin mb-3 text-blue-500/50" />
                          <span className="text-sm font-medium">Loading table data...</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </main>
        
        {/* Footer */}
        <footer className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end items-center gap-3 flex-shrink-0">
            <div className="text-xs text-gray-400 mr-auto">
                Press ESC to close
            </div>
          <button
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium px-5 py-2.5 rounded-lg transition-colors duration-200"
            onClick={handleClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
