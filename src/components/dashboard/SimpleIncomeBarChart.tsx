'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { buildApiUrl } from '@/lib/api';

type ChartDataPoint = {
  category: string;
  amount: number;
};

interface SimpleIncomeBarChartProps {
  authToken: string | null;
  compact?: boolean;
  clientId?: number | null; // For admin access to specific client data
  comparisonClientId?: number | null; // For comparing with another client
}

export const SimpleIncomeBarChart: React.FC<SimpleIncomeBarChartProps> = ({
  authToken,
  compact = false,
  clientId = null,
  comparisonClientId = null
}) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
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

  // Format abbreviated number
  const formatAbbreviatedNumber = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';

    const absValue = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
    if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
    if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
    return sign + '$' + absValue.toFixed(0);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isComparison = !!(comparisonClientId && clientNames);
      
      return (
        <div className="bg-slate-900 bg-opacity-95 text-white p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mb-1 last:mb-0">
              <p className="text-sm font-medium" style={{ color: entry.color }}>
                 {isComparison ? (entry.name === 'amount1' ? clientNames?.client1 : clientNames?.client2) : 'Amount'}
              </p>
              <p className="text-sm ml-2">
                {formatCurrency(entry.value)}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Colors for bars
  const gradientColors = [
    '#1e3a8a', // rgba(30, 58, 138, 0.9)
    '#0ea5e9', // rgba(14, 165, 233, 0.85)
    '#10b981', // rgba(16, 185, 129, 0.85)
    '#f59e0b', // rgba(245, 158, 11, 0.85)
    '#8b5cf6', // rgba(139, 92, 246, 0.85)
  ];

  // Load chart data
  useEffect(() => {
    if (!authToken) return;

    const loadChartData = async () => {
      setLoading(true);
      try {
        let apiUrl;
        if (comparisonClientId && clientId) {
          apiUrl = buildApiUrl(`/api/admin/clients/compare/charts/income-bar-chart?client1_id=${clientId}&client2_id=${comparisonClientId}`);
        } else if (clientId) {
          apiUrl = buildApiUrl(`/api/admin/client/${clientId}/charts/income-bar-chart`);
        } else {
          apiUrl = buildApiUrl('/api/charts/income-bar-chart');
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok || response.status === 200) {
          const data = await response.json();
          
          if (comparisonClientId && clientId) {
            // Handle comparison
             setClientNames({
              client1: data.client1.client_name || 'Client 1',
              client2: data.client2.client_name || 'Client 2'
            });

            const data1 = data.client1.data;
            const data2 = data.client2.data;

             // Merge data
            const mergedData = data1.map((item1: any) => {
              const item2 = data2.find((i: any) => i.income_category === item1.income_category);
              return {
                category: item1.income_category,
                amount1: parseFloat(item1.amount) || 0,
                amount2: item2 ? parseFloat(item2.amount) || 0 : 0
              };
            });
            setChartData(mergedData);

          } else {
            // Single client
            const normalized: ChartDataPoint[] = data.data.map((item: any) => ({
              category: item.income_category,
              amount: parseFloat(item.amount) || 0
            }));
            setChartData(normalized);
            setClientNames(null);
          }
          setLoading(false);
        } else {
          console.error('[SimpleIncomeBarChart] Response not ok:', response.status, response.statusText);
          setLoading(false);
        }
      } catch (error) {
        console.error('[SimpleIncomeBarChart] Income chart error:', error);
        setLoading(false);
      }
    };

    loadChartData();
  }, [authToken, clientId, comparisonClientId]);

  const isComparison = !!comparisonClientId;

  return (
    <article className={`bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200/50 flex-1 min-h-0 flex flex-col justify-start backdrop-blur-sm h-full ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
        <h3 className={`text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className={`${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-blue-600 rounded-full`}></span>
          Income Analysis
        </h3>
        {isComparison && (
          <div className="flex gap-2 text-sm min-w-0">
             <div className="flex items-center gap-1 min-w-0 flex-auto">
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              <span className="font-medium whitespace-nowrap" title={clientNames?.client1 || 'Client A'}>{clientNames?.client1 || 'Client A'}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium whitespace-nowrap" title={clientNames?.client2 || 'Client B'}>{clientNames?.client2 || 'Client B'}</span>
            </div>
          </div>
        )}
      </div>
      <div className="relative w-full h-full flex-1 min-h-0 flex items-center justify-center">
        {loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm leading-none animate-pulse flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={200}>
            <BarChart
              key={isComparison ? 'comparison-mode' : 'single-mode'}
              data={chartData}
              margin={{
                top: compact ? 15 : 25,
                right: compact ? 5 : 10,
                bottom: compact ? 25 : 40,
                left: compact ? 2 : 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{
                  fontSize: compact ? 10 : (isComparison ? 12 : (typeof window !== 'undefined' && window.innerHeight < 900 ? 11 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 11 : 13))),
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 'bold',
                  fill: '#64748b'
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatAbbreviatedNumber}
                tick={{
                  fontSize: compact ? 11 : (isComparison ? 13 : (typeof window !== 'undefined' && window.innerHeight < 900 ? 12 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 14))),
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 'bold',
                  fill: '#64748b'
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {isComparison && (
                 <Bar
                  dataKey="amount1"
                  name="amount1"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                 />
              )}
              {isComparison && (
                 <Bar
                  dataKey="amount2"
                  name="amount2"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                 />
              )}
              {!isComparison && (
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={gradientColors[index % gradientColors.length]} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
};