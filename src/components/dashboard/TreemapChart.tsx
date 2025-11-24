'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { buildApiUrl } from '@/lib/api';

type TreemapDataPoint = {
  category: string;
  value: number;
};

interface TreemapChartProps {
  authToken: string | null;
  onDataUpdate?: (data: TreemapDataPoint[]) => void;
  isInitialLoad?: boolean;
  initialData?: TreemapDataPoint[];
  compact?: boolean;
  clientId?: number | null; // For admin access to specific client data
  comparisonClientId?: number | null; // For comparing with another client
}

// Custom colors for financial categories - Professional financial dashboard palette
const FINANCIAL_COLORS = {
  'Equity': '#1e40af',          // Deep Blue - Stable, trustworthy
  'Cash': '#047857',            // Deep Emerald Green - Secure, liquid
  'Real Estate': '#b45309',     // Rich Amber/Brown - Tangible, solid
  'Fixed Income': '#6b21a8',    // Deep Purple - Conservative, reliable
  'Alternative': '#dc2626',     // Deep Red - Higher risk, growth
  'Commodities': '#0891b2',     // Cyan - Diversification
  'International': '#7c2d12',   // Dark Brown - Global exposure
  'Other': '#475569'            // Slate Gray - Neutral
};

// Custom content component for treemap cells
const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, value } = props;

  // Safety check for missing name property
  if (!name) return null;

  const categoryColor = FINANCIAL_COLORS[name as keyof typeof FINANCIAL_COLORS] || '#475569';
  
  // Format currency value
  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';

    const absValue = Math.abs(amount);
    if (absValue >= 1000000000) return '$' + (absValue / 1000000000).toFixed(1) + 'B';
    if (absValue >= 1000000) return '$' + (absValue / 1000000).toFixed(1) + 'M';
    if (absValue >= 1000) return '$' + (absValue / 1000).toFixed(1) + 'K';
    return '$' + absValue.toFixed(0);
  };

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: categoryColor,
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      {/* Only show text if the area is large enough to display it properly */}
      {width > 40 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={width > 100 ? 14 : 10}
            fontWeight="600"
            fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            letterSpacing="0.025em"
          >
            {name.length > 10 && width < 80 ? name.substring(0, 8) + '...' : name}
          </text>
          {height > 50 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={width > 100 ? 12 : 9}
              fontWeight="500"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              letterSpacing="0.01em"
              opacity={0.95}
            >
              {formatCurrency(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatCurrency = (amount: number) => {
      if (amount === null || amount === undefined || isNaN(amount)) return '$0';

      const absValue = Math.abs(amount);
      if (absValue >= 1000000000) return '$' + (absValue / 1000000000).toFixed(1) + 'B';
      if (absValue >= 1000000) return '$' + (absValue / 1000000).toFixed(1) + 'M';
      if (absValue >= 1000) return '$' + (absValue / 1000).toFixed(1) + 'K';
      return '$' + absValue.toFixed(0);
    };

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 z-50">
        <p className="font-semibold text-slate-800">{data.name}</p>
        <p className="text-slate-600">{formatCurrency(data.value)}</p>
      </div>
    );
  }
  return null;
};

export const TreemapChart: React.FC<TreemapChartProps> = ({
  authToken,
  onDataUpdate,
  isInitialLoad = false,
  initialData,
  compact = false,
  clientId = null,
  comparisonClientId = null
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<TreemapDataPoint[] | null>(
    Array.isArray(initialData) ? initialData : null
  );
  const [comparisonData, setComparisonData] = useState<TreemapDataPoint[] | null>(null);
  const [clientNames, setClientNames] = useState<{client1: string, client2: string} | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const hasAnimatedOnceRef = useRef(false);

  // Transform API data to treemap format
  const transformDataForTreemap = (data: TreemapDataPoint[]) => {
    return data.map(item => ({
      name: item.category,
      value: item.value
    }));
  };

  // Load treemap data
  const loadTreemapData = async () => {
    if (!authToken || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let apiUrl;
      if (comparisonClientId && clientId) {
        apiUrl = buildApiUrl(`/api/admin/clients/compare/charts/treemap?client1_id=${clientId}&client2_id=${comparisonClientId}`);
      } else if (clientId) {
        apiUrl = buildApiUrl(`/api/admin/client/${clientId}/charts/treemap`);
      } else {
        apiUrl = buildApiUrl('/api/charts/treemap');
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.status >= 200 && response.status < 300) {
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error('Failed to parse JSON response');
        }
        
        if (comparisonClientId && clientId) {
           // Handle comparison response
           const data1 = result.client1.data.map((item: any) => ({
            category: item.category,
            value: parseFloat(item.value) || 0
          }));
          const data2 = result.client2.data.map((item: any) => ({
            category: item.category,
            value: parseFloat(item.value) || 0
          }));

          setClientNames({
            client1: result.client1.client_name || 'Client 1',
            client2: result.client2.client_name || 'Client 2'
          });

          setChartData(data1);
          setComparisonData(data2);
        } else if (result && result.data && Array.isArray(result.data)) {
          const normalized: TreemapDataPoint[] = result.data.map((item: any) => ({
            category: item.category,
            value: parseFloat(item.value) || 0
          }));
          
          setChartData(normalized);
          onDataUpdate?.(normalized);
          setComparisonData(null);
          setClientNames(null);
        } else {
          throw new Error('Invalid response format: missing or invalid data array');
        }
        
        hasLoadedOnceRef.current = true;
        hasAnimatedOnceRef.current = true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load treemap data';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  // Load data when component mounts or clientId changes
  useEffect(() => {
    if (Array.isArray(initialData)) {
      setChartData(initialData);
      setLoading(false);
      hasLoadedOnceRef.current = true;
      return;
    }

    if (authToken) {
      loadTreemapData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [authToken, clientId, comparisonClientId]);

  const treemapData1 = chartData ? transformDataForTreemap(chartData) : [];
  const treemapData2 = comparisonData ? transformDataForTreemap(comparisonData) : [];
  const isComparison = !!comparisonClientId;
  const hasData = treemapData1.length > 0 || treemapData2.length > 0;



  return (
    <div
      ref={containerRef}
      className={`bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200/50 flex flex-col justify-start backdrop-blur-sm h-full ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <h3 className={`text-slate-700 font-bold uppercase tracking-wider ${compact ? 'text-xs' : 'text-sm'}`}>
          Asset Allocation {isComparison ? '(Comparison)' : ''}
        </h3>
        {loading && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-xs text-slate-500">Loading</span>
          </div>
        )}
      </div>

      <div className="relative w-full flex-1 min-h-0 flex gap-2 pb-4">
        {loading && !hasData && ( // Only show loading overlay if no data is present yet
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm leading-none animate-pulse flex justify-center items-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 text-sm text-center z-10">
            <p className="mb-2">Failed to load treemap data</p>
            <button 
              onClick={loadTreemapData}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Chart 1 */}
        {!loading && !error && treemapData1.length > 0 && (
          <div className={`relative ${isComparison ? 'w-1/2 border-r border-slate-200 pr-1' : 'w-full'}`}>
            {isComparison && (
              <div className="text-sm font-semibold text-center mb-1 text-blue-600 truncate px-2" title={clientNames?.client1 || 'Client A'}>{clientNames?.client1 || 'Client A'}</div>
            )}
            <ResponsiveContainer width="100%" height="100%" debounce={200}>
              <Treemap
                data={treemapData1}
                dataKey="value"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomizedContent />}
                animationBegin={0}
                animationDuration={hasAnimatedOnceRef.current ? 0 : 800}
                isAnimationActive={!hasAnimatedOnceRef.current}
                key={isComparison ? 'treemap-comp-1' : 'treemap-single'} // Add key for re-render
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2 (Comparison) */}
        {isComparison && !loading && !error && treemapData2.length > 0 && (
           <div className="relative w-1/2 pl-1">
            <div className="text-sm font-semibold text-center mb-1 text-purple-600 truncate px-2" title={clientNames?.client2 || 'Client B'}>{clientNames?.client2 || 'Client B'}</div>
            <ResponsiveContainer width="100%" height="100%" debounce={200}>
              <Treemap
                data={treemapData2}
                dataKey="value"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomizedContent />}
                animationBegin={0}
                animationDuration={hasAnimatedOnceRef.current ? 0 : 800}
                isAnimationActive={!hasAnimatedOnceRef.current}
                key="treemap-comp-2" // Add key for re-render
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && !hasData && ( // Show "No data" message if no data after loading
          <div className="text-slate-500 text-sm text-center w-full flex items-center justify-center">
            <p>No asset allocation data available</p>
          </div>
        )}
      </div>

      {/* Legend - Always visible with proper spacing */}
      {!loading && !error && hasData && (
        <div className={`flex flex-wrap gap-2 justify-center pt-3 pb-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          {Object.entries(FINANCIAL_COLORS).map(([category, color]) => {
            const categoryData1 = treemapData1.find(item => item.name === category);
            const categoryData2 = treemapData2.find(item => item.name === category);
            if (!categoryData1 && !categoryData2) return null; // Only show legend for categories present in at least one chart
            
            return (
              <div key={category} className="flex items-center gap-1">
                <div
                  className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full border border-white shadow-sm`}
                  style={{ backgroundColor: color }}
                ></div>
                <span className={`text-slate-600 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{category}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};