'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useVisibilityObserver } from '@/hooks/useVisibilityObserver';
import { buildApiUrl } from '@/lib/api';

type ChartDataPoint = {
  category: string;
  amount: number;
};

interface IncomeBarChartProps {
  authToken: string | null;
  onChartDataUpdate: (data: any[]) => void;
  isInitialLoad: boolean;
  initialData?: ChartDataPoint[];
  prefetchComplete: boolean;
}

export const IncomeBarChart: React.FC<IncomeBarChartProps> = ({
  authToken,
  onChartDataUpdate,
  isInitialLoad,
  initialData,
  prefetchComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const isChartVisible = useVisibilityObserver(containerRef, {
    threshold: [0.35, 0.6, 0.85, 0.95],
    rootMargin: '0px 0px -5% 0px',
    freezeOnceVisible: true
  });
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

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
      const value = payload[0].value;
      const dataValues = chartData.map(item => item.amount);
      const total = dataValues.reduce((sum, val) => sum + val, 0);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-slate-900 bg-opacity-95 text-white p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-sm">Amount: {formatCurrency(value)}</p>
          <p className="text-sm">Percentage: {percentage}%</p>
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

  // Load income bar chart
  const loadIncomeBarChart = async () => {
    if (!authToken || !isMountedRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const response = await fetch(buildApiUrl('/api/charts/income-bar-chart'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const normalized: ChartDataPoint[] = data.data.map((item: any) => ({
          category: item.income_category,
          amount: parseFloat(item.amount) || 0
        }));

        onChartDataUpdate(normalized);
        setChartData(normalized);
        setChartLoaded(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Income chart error:', error);
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Load chart when prefetched data is unavailable
  useEffect(() => {
    if (Array.isArray(initialData)) {
      setChartData(initialData);
      setChartLoaded(true);
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!prefetchComplete) return;
    if (Array.isArray(initialData)) return;
    if (chartData.length > 0) return;
    loadIncomeBarChart();
  }, [prefetchComplete, chartData, authToken, initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <article ref={containerRef} className={`bg-gradient-to-br from-white to-slate-50 p-4 lg:p-6 rounded-xl shadow-lg border border-slate-200/50 flex-1 min-h-0 max-h-[50vh] lg:max-h-[60vh] flex flex-col justify-start backdrop-blur-sm ${isInitialLoad ? '' : ''}`} data-chart="income-bar-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-700 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Income Analysis
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>
      <div className="relative w-full h-full flex-1 min-h-0 flex items-center justify-center">
        {loading ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm leading-none animate-pulse flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 25,
                right: 10,
                bottom: 3,
                left: 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{
                  fontSize: typeof window !== 'undefined' && window.innerHeight < 900 ? 10 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 11 : 13),
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
                  fontSize: typeof window !== 'undefined' && window.innerHeight < 900 ? 11 : (typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 14),
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 'bold',
                  fill: '#64748b'
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
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
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
};

