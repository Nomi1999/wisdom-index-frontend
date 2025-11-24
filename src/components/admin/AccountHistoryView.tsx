'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountSelector } from '../dashboard/AccountSelector';
import { TimeSeriesChart } from '../dashboard/TimeSeriesChart';
import { HistoryTable } from '../dashboard/HistoryTable';
import { DateRangePicker } from '../dashboard/DateRangePicker';
import { ExportControls } from '../dashboard/ExportControls';
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

interface AdminAccountHistoryViewProps {
  authToken: string | null;
  clientId: number; // Admin-specific: need to pass client ID to access their accounts
}

export const AdminAccountHistoryView: React.FC<AdminAccountHistoryViewProps> = ({ authToken, clientId }) => {
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
    if (authToken && clientId) {
      loadAccounts();
    }
  }, [authToken, clientId]);

  useEffect(() => {
    if (selectedAccount && authToken && clientId) {
      setHistoryInitialized(false);
      loadAccountHistory();
    }
  }, [selectedAccount, startDate, endDate, authToken, clientId, currentPage]);

  const loadAccounts = async () => {
    if (!authToken || !clientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/api/admin/client/${clientId}/accounts`), {
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
    if (!authToken || !selectedAccount || !clientId) return;

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
        buildApiUrl(`/api/admin/client/${clientId}/accounts/${selectedAccount}/history?${params.toString()}`),
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
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Client Account History</h2>
        <p className="text-sm text-gray-600 mt-1">
          {getSelectedAccountName()
            ? `Viewing: ${getSelectedAccountName()} for Client ID: ${clientId}`
            : 'Select an account to explore its history.'}
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <AccountSelector
              accounts={accounts}
              selectedAccount={selectedAccount}
              onAccountChange={handleAccountChange}
              loading={loading}
            />
          </div>

          <div className="flex-1">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateRangeChange}
              minDate={availableStartDate}
              maxDate={availableEndDate}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('chart')}
              aria-pressed={viewMode === 'chart'}
              className={cn(
                'transition-colors',
                viewMode === 'chart' &&
                  'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
              )}
            >
              Chart View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={cn(
                'transition-colors',
                viewMode === 'table' &&
                  'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
              )}
            >
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

      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
        )}

        {loading || !historyInitialized ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading account history...</p>
            </div>
          </div>
        ) : viewMode === 'chart' ? (
          historyData.length === 0 ? (
            <div className="flex items-center justify-center min-h-[320px]">
              <div className="text-center text-gray-500">
                <p>No data available for the selected period</p>
              </div>
            </div>
          ) : (
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