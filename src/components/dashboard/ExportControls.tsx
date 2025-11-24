'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportControlsProps {
  data: { date: string; value: number }[];
  accountName: string;
  dateRange: { start: Date | null; end: Date | null };
  disabled?: boolean;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  data,
  accountName,
  dateRange,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState<'csv' | 'excel' | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateRange = () => {
    const startStr = formatDate(dateRange.start);
    const endStr = formatDate(dateRange.end);

    // If no filter dates are set, calculate actual range from the data
    if (!startStr && !endStr && data.length > 0) {
      const dates = data.map(item => new Date(item.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      return `${formatDate(minDate)} to ${formatDate(maxDate)}`;
    } else if (!startStr && endStr) {
      return `Up to ${endStr}`;
    } else if (startStr && !endStr) {
      return `From ${startStr}`;
    } else if (startStr && endStr) {
      return `${startStr} to ${endStr}`;
    } else {
      return 'No Data';
    }
  };

  const generateFileName = (extension: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const accountPart = accountName ? accountName.replace(/[^a-zA-Z0-9]/g, '_') : 'account';
    const datePart = dateRange.start && dateRange.end
      ? `_${formatDate(dateRange.start)}_to_${formatDate(dateRange.end)}`
      : '';
    return `${accountPart}_history${datePart}_${timestamp}.${extension}`;
  };

  const exportToCSV = async () => {
    if (data.length === 0) return;

    setIsExporting('csv');
    try {
      // Sort data by date
      const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create CSV content
      const headers = ['Date', 'Value'];
      const rows = sortedData.map(item => [
        item.date,
        item.value.toString()
      ]);

      // Add metadata
      const metadata = [
        ['# Account History Export'],
        [`# Account: ${accountName}`],
        [`# Date Range: ${formatDateRange()}`],
        [`# Exported: ${new Date().toLocaleString()}`],
        []
      ];

      const csvContent = [
        ...metadata,
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export to CSV. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const exportToExcel = async () => {
    if (data.length === 0) return;

    setIsExporting('excel');
    try {
      // Sort data by date
      const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create data for worksheet
      const wsData = [
        ['Account History Export'],
        ['Account:', accountName],
        ['Date Range:', formatDateRange()],
        ['Exported:', new Date().toLocaleString()],
        [],
        ['Date', 'Value'],
        ...sortedData.map(item => [item.date, item.value])
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { width: 15 }, // Date column
        { width: 20 }  // Value column
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Account History');

      // Generate and download file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={exportToCSV}
        disabled={disabled || isExporting !== null || data.length === 0}
        className={cn(
          'flex items-center gap-2 border border-transparent text-white shadow-sm transition-colors',
          'bg-[#2b8c4a] hover:bg-[#24753f] focus-visible:ring-[#2b8c4a]/40'
        )}
      >
        <FileText className="h-4 w-4" />
        {isExporting === 'csv' ? 'Exporting...' : 'CSV'}
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={exportToExcel}
        disabled={disabled || isExporting !== null || data.length === 0}
        className={cn(
          'flex items-center gap-2 border border-transparent text-white shadow-sm transition-colors',
          'bg-[#217346] hover:bg-[#1b5c38] focus-visible:ring-[#217346]/40'
        )}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {isExporting === 'excel' ? 'Exporting...' : 'Excel'}
      </Button>
    </div>
  );
};
