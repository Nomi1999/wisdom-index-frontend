'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface ColumnInfo {
  name: string;
  type: string;
}

interface TableData {
  [key: string]: any;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export function DatabaseViewer() {
  const [tables] = useState([
    'account_history', 'businesses', 'charities', 'clients',
    'disability_ltc_insurance_accounts', 'entity_interests', 'expenses', 'facts',
    'flows', 'holdings', 'incomes', 'investment_deposit_accounts',
    'liability_note_accounts', 'life_insurance_annuity_accounts', 'medical_insurance_accounts',
    'metric_targets', 'personal_property_accounts', 'property_casualty_insurance_accounts',
    'real_estate_assets', 'savings', 'values'
  ]);
  
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientFilter, setClientFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, clientFilter, currentPage]);

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (currentPage * pageSize).toString(),
      });
      
      if (clientFilter) {
        params.append('client_id', clientFilter);
      }
      
      const response = await fetch(buildApiUrl(`/api/admin/tables/${selectedTable}?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTableData(data.data);
        setColumns(data.columns);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (tableData.length === 0) return;
    
    const headers = columns.map(col => col.name).join(',');
    const rows = tableData.map(row => 
      columns.map(col => {
        const value = row[col.name];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    if (type.includes('timestamp')) {
      return new Date(value).toLocaleString();
    }
    
    if (type.includes('numeric') || type.includes('decimal')) {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    
    return value;
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-1">Database Viewer</h2>
            <p className="text-blue-100 text-sm">View and export database table data</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-white/30">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTable && (
              <Input
                placeholder="Filter by client ID"
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-32"
              />
            )}
            
            {selectedTable && tableData.length > 0 && (
              <Button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 flex items-center gap-1 shadow-sm transition-all duration-200"
                size="sm"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {selectedTable && (
        <Card className="p-4 shadow-md border-0 bg-gradient-to-br from-white to-slate-50">
          <div className="mb-4 pb-3 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="inline-block w-1 h-4 bg-blue-600 rounded-full"></span>
                  Table: {selectedTable}
                </h3>
                {pagination && (
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)}
                    of <span className="text-blue-600 font-semibold">{pagination.total}</span> records
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-500 font-medium">Live</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3"></div>
              <p className="text-slate-600 font-medium text-sm">Loading...</p>
              <p className="text-slate-500 text-xs mt-1">From {selectedTable}</p>
            </div>
          ) : tableData.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      {columns.map((column) => (
                        <TableHead key={column.name} className="px-3 py-2 font-semibold text-slate-700 border-r border-slate-200 last:border-r-0">
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-xs">{column.name}</span>
                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-1 py-0.5 rounded inline-block w-fit">
                              {column.type}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100">
                        {columns.map((column) => {
                          const value = row[column.name];
                          const isNull = value === null || value === undefined;
                          return (
                            <TableCell
                              key={column.name}
                              className={`px-3 py-2 border-r border-slate-100 last:border-r-0 ${
                                isNull ? 'text-slate-400 italic' : 'text-slate-700'
                              }`}
                            >
                              <div className="min-w-[80px] text-xs">
                                {formatValue(value, column.type)}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                  <Button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1"
                  >
                    Previous
                  </Button>
                   
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600">Page</span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-semibold min-w-[24px] text-center">
                      {currentPage + 1}
                    </span>
                    <span className="text-xs text-slate-600">of {totalPages}</span>
                  </div>
                   
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium text-sm">No data found</p>
              <p className="text-slate-500 text-xs mt-1">The table {selectedTable} appears to be empty</p>
            </div>
          )}
        </Card>
      )}

      {!selectedTable && (
        <Card className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-md">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium text-sm mb-1">Select a table to view its data</p>
          <p className="text-slate-500 text-xs">Choose from the available database tables above</p>
        </Card>
      )}
    </div>
  );
}
