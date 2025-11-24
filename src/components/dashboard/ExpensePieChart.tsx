'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { useVisibilityObserver } from '@/hooks/useVisibilityObserver';
import { buildApiUrl } from '@/lib/api';

type ExpenseChartDataPoint = {
  category: string;
  amount: number;
};

interface ExpensePieChartProps {
  authToken: string | null;
  onChartDataUpdate: (data: any[]) => void;
  isInitialLoad: boolean;
  initialData?: ExpenseChartDataPoint[];
  prefetchComplete: boolean;
}

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  authToken,
  onChartDataUpdate,
  isInitialLoad,
  initialData,
  prefetchComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ExpenseChartDataPoint[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [pendingDataset, setPendingDataset] = useState<ExpenseChartDataPoint[] | null>(
    Array.isArray(initialData) ? initialData : null
  );
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const wasVisibleRef = useRef(false);
  
  const isChartVisible = useVisibilityObserver(containerRef, {
    threshold: [0.35, 0.6, 0.85, 0.95],
    rootMargin: '0px 0px -5% 0px',
    freezeOnceVisible: true
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';

    const absValue = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
    if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
    if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
    return sign + '$' + absValue.toFixed(0);
  };

  // Colors for the pie chart
  const expenseColors = [
    'rgba(30, 58, 138, 0.85)',  // Primary blue --primary-color
    'rgba(59, 130, 246, 0.85)', // Primary light --primary-light
    'rgba(14, 165, 233, 0.85)', // Accent color --accent-color
    'rgba(100, 116, 139, 0.85)', // Secondary color --secondary-color
    'rgba(71, 85, 105, 0.85)',  // Gray-600 --gray-600
  ];

  // Calculate total for center text (only including visible categories)
  const totalExpense = chartData
    .filter(item => !hiddenCategories.has(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-slate-900 bg-opacity-95 text-white p-3.5 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{payload[0].name}</p>
          <p className="text-sm">Amount: {formatCurrency(value)}</p>
          <p className="text-sm">Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-col justify-center" style={{ paddingLeft: 0 }}>
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenCategories.has(entry.value);
          return (
            <li
              key={`item-${index}`}
              className="flex items-center mb-1 cursor-pointer transition-opacity hover:opacity-80"
              style={{
                fontSize: window.innerHeight < 900 ? '10px' :
                        window.innerWidth < 480 ? '10px' :
                        window.innerWidth < 1280 ? '10px' : '11px',
                fontWeight: 'bold',
                fontFamily: "'Inter', sans-serif",
                padding: window.innerHeight < 900 ? '2px 0' : window.innerWidth < 768 ? '3px 0' : '4px 0',
                opacity: isHidden ? 0.4 : 1
              }}
              onClick={() => {
                const newHiddenCategories = new Set(hiddenCategories);
                if (isHidden) {
                  newHiddenCategories.delete(entry.value);
                } else {
                  newHiddenCategories.add(entry.value);
                }
                setHiddenCategories(newHiddenCategories);
              }}
            >
              <span
                className="mr-2 rounded-full"
                style={{
                  backgroundColor: entry.color,
                  width: window.innerHeight < 900 ? '10px' :
                          window.innerWidth < 480 ? '10px' :
                          window.innerWidth < 1280 ? '12px' : '14px',
                  height: window.innerHeight < 900 ? '10px' :
                           window.innerWidth < 480 ? '10px' :
                           window.innerWidth < 1280 ? '12px' : '14px',
                  opacity: isHidden ? 0.4 : 1
                }}
              />
              <span className="text-slate-600">{isHidden ? `\u0336${entry.value}\u0336` : entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Load expense pie chart
  const loadExpensePieChart = async () => {
    if (!authToken || !isMountedRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const response = await fetch(buildApiUrl('/api/charts/expense-pie-chart'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const normalized: ExpenseChartDataPoint[] = data.data.map((item: any) => ({
          category: item.expense_category,
          amount: parseFloat(item.amount) || 0
        }));

        onChartDataUpdate(normalized);
        setPendingDataset(normalized);
      }
    } catch (error) {
      console.error('Expense chart error:', error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Load chart when prefetched data is unavailable
  useEffect(() => {
    if (Array.isArray(initialData)) {
      setPendingDataset(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (!prefetchComplete) return;
    if (Array.isArray(initialData)) return;
    if (pendingDataset) return;
    loadExpensePieChart();
  }, [prefetchComplete, pendingDataset, authToken, initialData]);

  useEffect(() => {
    if (pendingDataset && isMountedRef.current) {
      // Add a small delay to ensure animation triggers on initial load
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setChartData(pendingDataset);
          setLoading(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingDataset]);

  useEffect(() => {
    if (chartData.length > 0 && isChartVisible && !wasVisibleRef.current) {
      // Chart became visible with data, trigger animation
      wasVisibleRef.current = true;
    }
  }, [chartData, isChartVisible]);

  useEffect(() => {
    if (!isChartVisible && !wasVisibleRef.current) {
      // Chart became visible, trigger any needed animations
      wasVisibleRef.current = true;
    }
  }, [isChartVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <article ref={containerRef} className={`relative bg-gradient-to-br from-white to-slate-50 p-3 lg:p-4 rounded-xl shadow-lg border border-slate-200/50 flex-1 min-h-0 max-h-[45vh] sm:max-h-[50vh] md:max-h-[70vh] lg:max-h-[65vh] xl:max-h-[60vh] flex flex-col justify-start backdrop-blur-sm ${isInitialLoad ? '' : ''}`} data-chart="expense-pie-chart">
      <div className="flex items-center justify-between mb-1 lg:mb-2">
        <h3 className="text-slate-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
          Expense Analysis
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>
      <div className="relative w-full h-full flex-1 min-h-0 flex items-center justify-center">
        {loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm leading-none animate-pulse flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`chart-${chartData.length}-${JSON.stringify(chartData)}`}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="70%"
                innerRadius="45%"
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={expenseColors[index % expenseColors.length]}
                    stroke={hiddenCategories.has(entry.category) ? 'none' : expenseColors[index % expenseColors.length].replace('0.85', '1')}
                    strokeWidth={hiddenCategories.has(entry.category) ? 0 : 2}
                    fillOpacity={hiddenCategories.has(entry.category) ? 0.2 : 0.85}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => {
                      const newHiddenCategories = new Set(hiddenCategories);
                      if (hiddenCategories.has(entry.category)) {
                        newHiddenCategories.delete(entry.category);
                      } else {
                        newHiddenCategories.add(entry.category);
                      }
                      setHiddenCategories(newHiddenCategories);
                    }}
                  />
                ))}
                {/* Center text label */}
                {totalExpense > 0 && (
                  <Label
                    value={formatCurrency(totalExpense)}
                    position="center"
                    className="fill-slate-700 font-bold"
                    style={{
                      fontSize: window.innerWidth < 768 ? '14px' :
                                window.innerWidth < 1280 ? '15px' :
                                window.innerWidth <= 1920 && window.innerHeight <= 1200 ? '16px' : '20px',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                )}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={renderCustomizedLegend}
                verticalAlign="middle"
                align="left"
                layout="vertical"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No expense data available
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-center w-full">
        <p className="text-[10px] text-slate-500 italic bg-white/50 px-2 py-1 rounded leading-tight text-center">
          Tip: click legend categories to hide or show specific expenses.
        </p>
      </div>
    </article>
  );
};
