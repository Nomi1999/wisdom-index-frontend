'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface MetricDetail {
  metric_name: string;
  category: string;
  value: number | null;
  formatted_value: string;
  formula: string;
  description: string;
  tables: string[];
}

interface TableData {
  columns: Array<{
    name: string;
    display_name: string;
    type: 'text' | 'currency' | 'percentage' | 'number';
  }>;
  data: Record<string, string | number | boolean | null>[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MobileMetricDetailProps {
  isOpen: boolean;
  onClose: () => void;
  metricName: string;
  categoryName: string;
  metricsData: Record<string, any>;
}

export const MobileMetricDetail: React.FC<MobileMetricDetailProps> = ({
  isOpen,
  onClose,
  metricName,
  categoryName,
  metricsData
}) => {
  const [metricDetail, setMetricDetail] = React.useState<MetricDetail | null>(null);
  const [tableData, setTableData] = React.useState<Record<string, TableData>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const { isMobile } = useMobileDetection();
  const tabContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch metric details
  const fetchMetricDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
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
      );

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch metric details');
      }

      const detailsData = await detailsResponse.json();
      
      if (!detailsData.tables || !Array.isArray(detailsData.tables)) {
        detailsData.tables = [];
      }
      
      setMetricDetail(detailsData);

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
        );

        if (!dataResponse.ok) {
          throw new Error(`Failed to fetch data for table: ${tableName}`);
        }

        return { tableName, data: await dataResponse.json() };
      });

      const tableResults = await Promise.all(tableDataPromises);
      const newTableData: Record<string, TableData> = {};
      
      tableResults.forEach(({ tableName, data }) => {
        newTableData[tableName] = data;
      });

      setTableData(newTableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [metricName]);

  // Fetch metric details when modal opens
  React.useEffect(() => {
    if (isOpen && metricName) {
      fetchMetricDetails();
    }
  }, [isOpen, metricName, fetchMetricDetails]);

  // Reset state when closing
  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setMetricDetail(null);
      setTableData({});
    }
  }, [isOpen]);

  // Center selected tab in view
  React.useEffect(() => {
    if (tabContainerRef.current && activeTab) {
      const container = tabContainerRef.current;
      const tabs = container.querySelectorAll('button');
      const totalTabs = metricDetail?.tables ? metricDetail.tables.length + 1 : 1;
      const activeTabIndex = activeTab === 'overview' ? 0 : (metricDetail?.tables?.indexOf(activeTab) ?? -1) + 1;
      
      if (activeTabIndex >= 0 && tabs[activeTabIndex]) {
        const activeTabElement = tabs[activeTabIndex] as HTMLElement;
        const containerWidth = container.offsetWidth;
        const tabWidth = activeTabElement.offsetWidth;
        const tabLeft = activeTabElement.offsetLeft;
        
        // Calculate scroll position to center the tab
        const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab, metricDetail?.tables]);

  // Manage body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('metric-detail-open');
    } else {
      document.body.classList.remove('metric-detail-open');
    }

    return () => {
      document.body.classList.remove('metric-detail-open');
    };
  }, [isOpen]);

  // Don't render on desktop - move after all hooks
  if (!isMobile) return null;

  const formatFullValue = (value: number | null, category: string): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';

    if (category === 'planning' || category === 'wisdom-index') {
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      const absValue = Math.abs(numValue);
      const sign = numValue < 0 ? '-' : '';
      return sign + '$' + absValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  const formatCellValue = (value: string | number | boolean | null | undefined, type: string): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    switch (type) {
      case 'currency':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '-';
        const absValue = Math.abs(numValue);
        const sign = numValue < 0 ? '-' : '';
        if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
        if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
        if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
        return sign + '$' + absValue.toFixed(0);
      
      case 'percentage':
        const percentValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(percentValue)) return '-';
        return percentValue.toFixed(2) + '%';
      
      case 'number':
        const numberValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numberValue)) return '-';
        return numberValue.toLocaleString();
      
      default:
        return String(value);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assets': return 'from-emerald-700 via-emerald-800 to-emerald-900';
      case 'income': return 'from-blue-700 via-blue-800 to-blue-900';
      case 'expenses': return 'from-amber-600 via-amber-700 to-amber-800';
      case 'insurance': return 'from-rose-700 via-rose-800 to-rose-900';
      case 'planning': return 'from-indigo-700 via-indigo-800 to-indigo-900';
      case 'wisdom-index': return 'from-cyan-700 via-cyan-800 to-cyan-900';
      default: return 'from-slate-700 via-slate-800 to-slate-900';
    }
  };

  const getCategoryBgColor = (category: string) => {
    switch (category) {
      case 'assets': return 'bg-emerald-50';
      case 'income': return 'bg-blue-50';
      case 'expenses': return 'bg-amber-50';
      case 'insurance': return 'bg-rose-50';
      case 'planning': return 'bg-indigo-50';
      case 'wisdom-index': return 'bg-cyan-50';
      default: return 'bg-slate-50';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`metric-detail-${metricName}`}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[60] bg-white mobile-metric-detail-view"
        style={{ 
          width: '100vw', 
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        }}
      >
        <div className="h-full flex flex-col" style={{ height: '100vh', maxHeight: '100vh' }}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${getCategoryColor(categoryName)} text-white px-4 py-4 shadow-lg flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-colors active:bg-white/30"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold text-white">
                  {metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <p className="text-sm text-white/80 capitalize">
                  {categoryName.replace('_', ' ')} • {categoryName}
                </p>
              </div>
              
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
          </div>

          {/* Main Value Display */}
          {!loading && metricDetail && (
            <div className={`bg-gradient-to-r ${getCategoryColor(categoryName)} px-4 pb-6 pt-2`}>
              <div className="text-center">
                <p className="text-white/80 text-sm font-medium mb-2">Current Value</p>
                <div className="text-4xl font-bold text-white mb-2">
                  {formatFullValue(metricDetail.value, metricDetail.category)}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {metricsData[metricName]?.status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      metricsData[metricName].status === 'above' ? 'bg-emerald-50 text-emerald-700' :
                      metricsData[metricName].status === 'below' ? 'bg-rose-50 text-rose-700' :
                      metricsData[metricName].status === 'equal' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {metricsData[metricName].target_display_text || 'No target'}
                    </div>
                  )}
                  {metricsData[metricName]?.target && (
                    <p className="text-white/80 text-xs">
                      Target: {formatFullValue(metricsData[metricName].target, metricDetail.category)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          {!loading && metricDetail && (
            <div className="bg-white border-b border-slate-100 px-4 py-4 flex-shrink-0">
              <div className="relative">
                {/* Animated Tab Indicator */}
<div 
                   className="absolute bottom-0 h-0.5 bg-gradient-to-r from-slate-600 to-slate-700 transition-all duration-300 ease-out rounded-full"
                  style={{
                    width: `${100 / (metricDetail.tables.length + 1)}%`,
                    left: `${(activeTab === 'overview' ? 0 : metricDetail.tables.indexOf(activeTab) + 1) * (100 / (metricDetail.tables.length + 1))}%`
                  }}
                />
                
                <div 
                  ref={tabContainerRef}
                  className="flex space-x-2 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <button
                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap group flex-shrink-0 ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-600/25 scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-105'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
<div className={`flex items-center justify-center w-5 h-5 rounded-lg transition-all duration-300 ${
                        activeTab === 'overview' 
                          ? 'bg-white/20' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="tracking-tight">Overview</span>
                    
                  </button>
                  
                  {metricDetail.tables.map((tableName, index) => (
                    <button
                      key={tableName}
                      className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap group flex-shrink-0 ${
                        activeTab === tableName
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-600/25 scale-105'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-105'
                      }`}
                      onClick={() => setActiveTab(tableName)}
                    >
<div className={`flex items-center justify-center w-5 h-5 rounded-lg transition-all duration-300 ${
                          activeTab === tableName 
                            ? 'bg-white/20' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="tracking-tight capitalize">{tableName.replace(/_/g, ' ')}</span>
                      
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto mobile-metric-detail-content" style={{ 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Loading details...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                  className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
                  onClick={fetchMetricDetails}
                >
                  Try Again
                </button>
              </div>
            ) : metricDetail ? (
              <div className="p-4 space-y-4 pb-24">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Formula Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-slate-900 font-semibold text-lg">Calculation Formula</h3>
                      </div>
                      <div className={`${getCategoryBgColor(categoryName)} p-4 rounded-xl border border-slate-200`}>
                        <code className="text-sm text-slate-700 leading-relaxed break-all">
                          {metricDetail.formula}
                        </code>
                      </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-slate-900 font-semibold text-lg">Description</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {metricDetail.description}
                      </p>
                    </div>

                    {/* Metadata Cards */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category</p>
                            <p className="text-slate-900 font-medium capitalize">{metricDetail.category.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Data Sources</p>
                            <p className="text-slate-900 font-medium text-sm">
                              {metricDetail.tables.join(', ').replace(/_/g, ' ') || 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Data */}
                {metricDetail.tables.map((tableName) => {
                  if (activeTab !== tableName) return null;
                  
                  const data = tableData[tableName];
                  
                  return (
                    <div key={tableName} className="animate-in fade-in duration-200">
                      {data ? (
                        <div className="space-y-4">
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    {data.columns.map((column) => (
                                      <th key={column.name} className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                        {column.display_name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {data.data.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                      {data.columns.map((column) => (
                                        <td key={column.name} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
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
                              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-col justify-between items-center gap-3">
                                <span className="text-sm text-slate-500 text-center">
                                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                                  {data.pagination.total} results
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    disabled={data.pagination.page === 1}
                                  >
                                    Previous
                                  </button>
                                  <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-center">
                                    {data.pagination.page} / {data.pagination.totalPages}
                                  </span>
                                  <button
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    disabled={data.pagination.page === data.pagination.totalPages}
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-3"></div>
                          <span className="text-sm font-medium">Loading table data...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Bottom Padding */}
          <div className="h-20 bg-white border-t border-slate-100 flex-shrink-0"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileMetricDetail;