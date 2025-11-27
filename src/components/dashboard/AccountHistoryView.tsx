'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountSelector } from './AccountSelector';
import { TimeSeriesChart } from './TimeSeriesChart';
import { HistoryTable } from './HistoryTable';
import { DateRangePicker } from './DateRangePicker';
import { ExportControls } from './ExportControls';
import { buildApiUrl } from '@/lib/api';

interface Account {
  account_id: string;
  account_name?: string;
  account_type?: string;
  current_value?: number;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

interface HistoryDataPoint {
  as_of_date: string;
  value: number;
}

interface AccountHistoryViewProps {
  authToken: string | null;
}

export const AccountHistoryView: React.FC<AccountHistoryViewProps> = ({ authToken }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [historyInitialized, setHistoryInitialized] = useState(false);

  const selectedAccountDetails = accounts.find((acc) => acc.account_id === selectedAccount);
  const availableStartDate = selectedAccountDetails?.date_range?.start_date
    ? new Date(selectedAccountDetails.date_range.start_date)
    : null;
  const availableEndDate = selectedAccountDetails?.date_range?.end_date
    ? new Date(selectedAccountDetails.date_range.end_date)
    : null;

  useEffect(() => {
    if (authToken) {
      loadAccounts();
    }
  }, [authToken]);

  useEffect(() => {
    if (selectedAccount && authToken) {
      setHistoryInitialized(false);
      loadAccountHistory();
    }
  }, [selectedAccount, startDate, endDate, authToken, currentPage]);

  const loadAccounts = async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/accounts'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);

        if (data.accounts && data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].account_id);
        }
      } else if (response.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        throw new Error('Failed to load accounts');
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAccountHistory = async () => {
    if (!authToken || !selectedAccount) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('end_date', endDate.toISOString().split('T')[0]);
      }
      params.append('limit', '100');
      params.append('offset', String((currentPage - 1) * 100));

      const response = await fetch(
        buildApiUrl(`/api/accounts/${selectedAccount}/history?${params.toString()}`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHistoryData(data.history || []);
        const totalRecords = data.pagination?.total || 0;
        setTotalPages(Math.max(1, Math.ceil(totalRecords / 100)));
      } else if (response.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        throw new Error('Failed to load account history');
      }
    } catch (err) {
      console.error('Error loading account history:', err);
      setError('Failed to load account history. Please try again.');
    } finally {
      setLoading(false);
      setHistoryInitialized(true);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSelectedAccountName = () =>
    selectedAccountDetails?.account_name || selectedAccountDetails?.account_id || '';

return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Account History
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {getSelectedAccountName()
                ? `Viewing: ${getSelectedAccountName()}`
                : 'Select an account to explore its history.'}
            </p>
          </div>
          {selectedAccountDetails && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Value</p>
              <p className="text-xl font-bold text-blue-600">
                ${selectedAccountDetails.current_value?.toLocaleString() || '0'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Controls Section */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Account</label>
            <AccountSelector
              accounts={accounts}
              selectedAccount={selectedAccount}
              onAccountChange={handleAccountChange}
              loading={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateRangeChange}
              minDate={availableStartDate}
              maxDate={availableEndDate}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              className={cn(
                'transition-all duration-200',
                viewMode === 'chart' && 'shadow-md'
              )}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chart View
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                'transition-all duration-200',
                viewMode === 'table' && 'shadow-md'
              )}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Table View
            </Button>
          </div>

          <ExportControls
            data={historyData.map((point) => ({
              date: point.as_of_date,
              value: point.value
            }))}
            accountName={getSelectedAccountName()}
            dateRange={{ start: startDate, end: endDate }}
            disabled={loading || historyData.length === 0}
          />
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading || !historyInitialized ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading account history...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
            </div>
          </div>
        ) : viewMode === 'chart' ? (
          historyData.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 font-medium">No data available</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting the date range or selecting a different account</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <TimeSeriesChart
                data={historyData.map((point) => ({
                  date: point.as_of_date,
                  value: point.value
                }))}
                title="Account Value Over Time"
                loading={false}
                error={error || undefined}
                showEmptyState={false}
              />
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Starting Value</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    ${historyData[historyData.length - 1]?.value?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Ending Value</p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    ${historyData[0]?.value?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Change</p>
                  <p className={`text-lg font-bold mt-1 ${
                    ((historyData[0]?.value || 0) - (historyData[historyData.length - 1]?.value || 0)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(() => {
                      const start = historyData[historyData.length - 1]?.value || 0;
                      const end = historyData[0]?.value || 0;
                      if (start === 0) return '0.00%';
                      const change = ((end - start) / start) * 100;
                      return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                    })()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Data Points</p>
                  <p className="text-lg font-bold text-purple-900 mt-1">
                    {historyData.length}
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <HistoryTable
            data={historyData.map((point) => ({
              date: point.as_of_date,
              value: point.value
            }))}
            loading={loading || !historyInitialized}
            error={error || undefined}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </section>
    </div>
  );
};
