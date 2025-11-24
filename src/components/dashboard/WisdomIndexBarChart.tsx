'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { buildApiUrl } from '@/lib/api';

interface BarChartData {
  name: string;
  value: number;
}

interface WisdomIndexBarChartProps {
  authToken: string | null;
  compact?: boolean;
  clientId?: number | null; // For admin access to specific client data
  comparisonClientId?: number | null; // For comparing with another client
}

export const WisdomIndexBarChart: React.FC<WisdomIndexBarChartProps> = ({
  authToken,
  compact = false,
  clientId = null,
  comparisonClientId = null
}) => {
 const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clientNames, setClientNames] = useState<{client1: string, client2: string} | null>(null);
  const hasAnimatedOnceRef = useRef(false);

  useEffect(() => {
    const fetchBarChartData = async () => {
      if (!authToken) {
        setError('Authentication token is required');
        setLoading(false);
        return;
      }

      try {
        let apiUrl;
        if (comparisonClientId && clientId) {
          apiUrl = buildApiUrl(`/api/admin/clients/compare/charts/bar-chart?client1_id=${clientId}&client2_id=${comparisonClientId}`);
        } else if (clientId) {
          apiUrl = buildApiUrl(`/api/admin/client/${clientId}/charts/bar-chart`);
        } else {
          apiUrl = buildApiUrl('/api/charts/bar-chart');
        }
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bar chart data: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (comparisonClientId && clientId) {
          // Handle comparison data format
          const data1 = result.client1.data;
          const data2 = result.client2.data;
          setClientNames({
            client1: result.client1.client_name || 'Client 1',
            client2: result.client2.client_name || 'Client 2'
          });

          // Merge data for comparison
          const mergedData = data1.map((item1: any) => {
            const item2 = data2.find((i: any) => (i.metric_name || i.ratio_name) === (item1.metric_name || item1.ratio_name));
            return {
              name: item1.metric_name || item1.ratio_name,
              value1: (item1.metric_value || item1.ratio_value) * 100,
              value2: item2 ? (item2.metric_value || item2.ratio_value) * 100 : 0
            };
          });
          setData(mergedData);
        } else {
          // Handle single client data format
          const transformedData = result.data.map((item: any) => ({
            name: item.metric_name || item.ratio_name,
            value: (item.metric_value || item.ratio_value) * 100 // Convert decimal to percentage
          }));
          setData(transformedData);
          setClientNames(null);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching bar chart data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
        // Mark that animation has occurred once
        hasAnimatedOnceRef.current = true;
      }
    };

    fetchBarChartData();
  }, [authToken, clientId, comparisonClientId]);



  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading ratios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex items-center justify-center">
        <div className="text-center text-red-500 text-sm">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const isComparison = !!comparisonClientId;

  return (
    <motion.div
      initial={hasAnimatedOnceRef.current ? false : { opacity: 0, y: 20 }}
      animate={hasAnimatedOnceRef.current ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col ${compact ? 'px-2 py-1' : 'px-4 py-2'}`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-slate-700 font-bold uppercase tracking-wider ${compact ? 'text-xs mb-1' : 'text-sm'}`}>Wisdom Index Ratios</h3>
        {isComparison && (
          <div className="flex gap-4 text-sm min-w-0">
            <div className="flex items-center gap-1 min-w-0 flex-auto">
              <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0"></div>
              <span className="font-medium whitespace-nowrap" title={clientNames?.client1 || 'Client A'}>{clientNames?.client1 || 'Client A'}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <div className="w-3 h-3 bg-purple-500 rounded-sm flex-shrink-0"></div>
              <span className="font-medium whitespace-nowrap" title={clientNames?.client2 || 'Client B'}>{clientNames?.client2 || 'Client B'}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <BarChart
            key={isComparison ? 'comparison-mode' : 'single-mode'}
            data={data}
            margin={{
              top: compact ? 5 : 10,
              right: compact ? 10 : 20,
              left: compact ? 5 : 10,
              bottom: compact ? 6 : 15,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              textAnchor="middle"
              height={compact ? 30 : 50}
              tick={{ fontSize: compact ? 10 : (isComparison ? 13 : 12) }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              domain={[0, 120]}
              tick={{ fontSize: compact ? 10 : (isComparison ? 13 : 12) }}
            />
            <ReferenceLine
              y={100}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Math.round(Number(value))}%`, 
                isComparison 
                  ? (name === 'value1' ? (clientNames?.client1 || 'Client 1') : (clientNames?.client2 || 'Client 2'))
                  : 'Value'
              ]}
              labelFormatter={(label) => `Ratio: ${label}`}
            />
            {isComparison && (
              <Bar
                dataKey="value1"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="value1"
              />
            )}
            {isComparison && (
              <Bar
                dataKey="value2"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
                name="value2"
              />
            )}
            {!isComparison && (
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => `${Math.round(value)}%`}
                  style={{ fontSize: compact ? '11px' : '13px', fill: '#374151' }}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};