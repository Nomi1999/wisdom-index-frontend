'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { buildApiUrl } from '@/lib/api';

type ExpenseChartDataPoint = {
  category: string;
  amount: number;
};

interface SimpleExpensePieChartProps {
  authToken: string | null;
  compact?: boolean;
  clientId?: number | null; // For admin access to specific client data
  comparisonClientId?: number | null; // For comparing with another client
}

export const SimpleExpensePieChart: React.FC<SimpleExpensePieChartProps> = ({
  authToken,
  compact = false,
  clientId = null,
  comparisonClientId = null
}) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ExpenseChartDataPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<ExpenseChartDataPoint[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [clientNames, setClientNames] = useState<{client1: string, client2: string} | null>(null);

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
    'rgba(30, 58, 138, 0.85)',  // Primary blue
    'rgba(59, 130, 246, 0.85)', // Primary light
    'rgba(14, 165, 233, 0.85)', // Accent color
    'rgba(100, 116, 139, 0.85)', // Secondary color
    'rgba(71, 85, 105, 0.85)',  // Gray-600
  ];

  // Calculate total for center text (only including visible categories)
  const calculateTotal = (data: ExpenseChartDataPoint[]) => 
    data
    .filter(item => !hiddenCategories.has(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = calculateTotal(chartData);
  const totalComparisonExpense = calculateTotal(comparisonData);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-slate-900 bg-opacity-95 text-white p-3.5 rounded-lg shadow-lg z-50">
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
      <ul className="flex flex-wrap justify-center items-center gap-2" style={{ paddingLeft: 0 }}>
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenCategories.has(entry.value);
          return (
            <li
              key={`item-${index}`}
              className="flex items-center cursor-pointer transition-opacity hover:opacity-80"
              style={{
                fontSize: compact ? '10px' : '11px',
                fontWeight: 'bold',
                fontFamily: "'Inter', sans-serif",
                padding: '2px 4px',
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
                className="mr-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: entry.color,
                  width: '8px',
                  height: '8px',
                  opacity: isHidden ? 0.4 : 1
                }}
              />
              <span className="text-slate-600 whitespace-nowrap">{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Shared horizontal legend for comparison mode
  const renderSharedLegend = () => {
    // Get unique categories from both datasets
    const allCategories = new Set<string>();
    chartData.forEach(item => allCategories.add(item.category));
    comparisonData.forEach(item => allCategories.add(item.category));
    
    const categories = Array.from(allCategories);
    
    return (
      <div className="w-full border-t border-slate-200 bg-white bg-opacity-90 py-1">
        <ul className="flex flex-wrap justify-center items-center gap-1.5 px-2">
          {categories.map((category, index) => {
            const isHidden = hiddenCategories.has(category);
            return (
              <li
                key={`shared-item-${index}`}
                className="flex items-center cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  fontFamily: "'Inter', sans-serif",
                  opacity: isHidden ? 0.4 : 1
                }}
                onClick={() => {
                  const newHiddenCategories = new Set(hiddenCategories);
                  if (isHidden) {
                    newHiddenCategories.delete(category);
                  } else {
                    newHiddenCategories.add(category);
                  }
                  setHiddenCategories(newHiddenCategories);
                }}
              >
                <span
                  className="mr-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: expenseColors[index % expenseColors.length],
                    width: '8px',
                    height: '8px',
                    opacity: isHidden ? 0.4 : 1
                  }}
                />
                <span className="text-slate-600 whitespace-nowrap">{category}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Load chart data
  useEffect(() => {
    console.log('[SimpleExpensePieChart] Effect triggered', { authToken: !!authToken, clientId, comparisonClientId });
    if (!authToken) {
        console.log('[SimpleExpensePieChart] No authToken, returning');
        return;
    }

    const loadChartData = async () => {
      console.log('[SimpleExpensePieChart] Starting fetch');
      setLoading(true);
      try {
        let apiUrl;
        if (comparisonClientId && clientId) {
          apiUrl = buildApiUrl(`/api/admin/clients/compare/charts/expense-pie-chart?client1_id=${clientId}&client2_id=${comparisonClientId}`);
        } else if (clientId) {
          apiUrl = buildApiUrl(`/api/admin/client/${clientId}/charts/expense-pie-chart`);
        } else {
          apiUrl = buildApiUrl('/api/charts/expense-pie-chart');
        }
        
        console.log('[SimpleExpensePieChart] Fetching URL:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        console.log('[SimpleExpensePieChart] Response status:', response.status);

        if (response.ok || response.status === 200) {
          const data = await response.json();
          console.log('[SimpleExpensePieChart] Data received:', data);
          
          if (comparisonClientId && clientId) {
             console.log('[SimpleExpensePieChart] Processing comparison data');
             setClientNames({
              client1: data.client1?.client_name || 'Client 1',
              client2: data.client2?.client_name || 'Client 2'
            });

            const data1 = data.client1?.data?.map((item: any) => ({
              category: item.expense_category,
              amount: parseFloat(item.amount) || 0
            })) || [];
            const data2 = data.client2?.data?.map((item: any) => ({
              category: item.expense_category,
              amount: parseFloat(item.amount) || 0
            })) || [];
            
            setChartData(data1);
            setComparisonData(data2);
          } else {
            console.log('[SimpleExpensePieChart] Processing single data');
            const normalized: ExpenseChartDataPoint[] = data.data?.map((item: any) => ({
              category: item.expense_category,
              amount: parseFloat(item.amount) || 0
            })) || [];

            setChartData(normalized);
            setComparisonData([]);
            setClientNames(null);
          }
        } else {
          console.error('[SimpleExpensePieChart] Response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[SimpleExpensePieChart] Expense chart error:', error);
      } finally {
        console.log('[SimpleExpensePieChart] Finished fetch, setting loading false');
        setLoading(false);
      }
    };

    loadChartData();
  }, [authToken, clientId, comparisonClientId]);

  const isComparison = !!(comparisonClientId && clientNames);

  return (
    <article className={`relative bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200/50 flex-1 min-h-0 flex flex-col justify-start backdrop-blur-sm h-full ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-0.5' : 'mb-1'}`}>
        <h3 className={`text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className={`${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-rose-600 rounded-full`}></span>
          Expense Analysis
        </h3>
      </div>
      <div className="relative w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm leading-none animate-pulse flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : chartData.length > 0 ? (
          <>
            <div className={`flex-1 flex flex-col ${isComparison ? 'pb-6 pt-2' : 'pb-2 pt-1'} overflow-hidden`}>
              <div className={`flex items-start justify-center gap-1 flex-1 min-h-0`}>
                <div className={`relative h-full ${isComparison ? 'w-1/2 border-r border-slate-100' : 'w-full'}`}>
                  {isComparison && (
                     <div className="text-sm font-semibold text-center text-blue-600 truncate px-1 mb-0.5" title={clientNames?.client1 || 'Client A'}>{clientNames?.client1 || 'Client A'}</div>
                  )}
                  <div className={`h-full ${isComparison ? 'pb-2' : 'pb-1'} min-h-0`}>
                    <ResponsiveContainer width="100%" height="100%" debounce={200}>
                      <PieChart key={isComparison ? 'comp-1' : 'single'}>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isComparison ? '80%' : (compact ? '70%' : '85%')}
                          innerRadius={isComparison ? '65%' : (compact ? '55%' : '70%')}
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
                              style={{ cursor: 'pointer' }}
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
                          {/* Center text label - show based on mode */}
                          {!isComparison && totalExpense > 0 && (
                            <Label
                              value={formatCurrency(totalExpense)}
                              position="center"
                              className="fill-slate-700 font-bold"
                              style={{
                                fontSize: compact ? '14px' : '20px',
                                fontFamily: "'Inter', sans-serif"
                              }}
                            />
                          )}
                          {isComparison && totalExpense > 0 && (
                            <Label
                              value={formatCurrency(totalExpense)}
                              position="center"
                              className="fill-slate-700 font-bold"
                              style={{
                                fontSize: compact ? '12px' : '16px',
                                fontFamily: "'Inter', sans-serif"
                              }}
                            />
                          )}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {/* No legend here - we'll render it outside */}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              {isComparison && comparisonData.length > 0 && (
                <div className="relative h-full w-1/2 pl-1">
                  <div className="text-sm font-semibold text-center text-emerald-600 truncate px-1 mb-0.5" title={clientNames?.client2 || 'Client B'}>{clientNames?.client2 || 'Client B'}</div>
                  <div className="h-full pb-2 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={200}>
                      <PieChart key="comp-2">
                        <Pie
                          data={comparisonData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="80%"
                          innerRadius="65%"
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="category"
                          animationBegin={0}
                          animationDuration={1200}
                          animationEasing="ease-in-out"
                        >
                          {comparisonData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={expenseColors[index % expenseColors.length]}
                              stroke={hiddenCategories.has(entry.category) ? 'none' : expenseColors[index % expenseColors.length].replace('0.85', '1')}
                              strokeWidth={hiddenCategories.has(entry.category) ? 0 : 2}
                              fillOpacity={hiddenCategories.has(entry.category) ? 0.2 : 0.85}
                              style={{ cursor: 'pointer' }}
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
                          {/* Center text label for second chart */}
                          {isComparison && totalComparisonExpense > 0 && (
                            <Label
                              value={formatCurrency(totalComparisonExpense)}
                              position="center"
                              className="fill-slate-700 font-bold"
                              style={{
                                fontSize: compact ? '12px' : '16px',
                                fontFamily: "'Inter', sans-serif"
                              }}
                            />
                          )}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {/* No legend for second chart in comparison mode */}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              </div>
              
              {/* Legend for single mode - positioned outside the chart container */}
              {!isComparison && chartData.length > 0 && (
                <div className="mt-2 bg-white bg-opacity-90 py-2 border-t border-slate-200">
                  <div className="text-center text-xs text-slate-500 mb-1">
                    Click categories to toggle visibility
                  </div>
                  {renderCustomizedLegend({ payload: chartData.map((item, index) => ({
                    value: item.category,
                    color: expenseColors[index % expenseColors.length]
                  })) })}
                </div>
              )}
              
              {/* Shared legend for comparison mode - positioned absolutely */}
              {isComparison && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent pt-2">
                  <div className="text-center text-xs text-slate-500 mb-1">
                    Click categories to toggle visibility
                  </div>
                  {renderSharedLegend()}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No expense data available
          </div>
        )}
      </div>
    </article>
  );
};