'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimeSeriesChartProps {
  data: { date: string; value: number }[];
  title?: string;
  loading?: boolean;
  error?: string;
  showEmptyState?: boolean;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title = "Account Value Over Time",
  loading = false,
  error,
  showEmptyState = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || error || data.length === 0) return;

    // Dynamically import Chart.js to avoid SSR issues
    const importChart = async () => {
      const [{ default: Chart }] = await Promise.all([
        import('chart.js/auto'),
        import('chartjs-adapter-date-fns')
      ]);

      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const existingChart = Chart.getChart(ctx.canvas);
      if (existingChart) {
        existingChart.destroy();
      } else if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Sort data by date
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedData.map(item => item.date),
          datasets: [{
            label: 'Account Value',
            data: sortedData.map(item => item.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y;
                  return `Value: $${(value || 0).toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                parser: 'yyyy-MM-dd',
                displayFormats: {
                  day: 'MMM dd',
                  month: 'MMM yyyy',
                  year: 'yyyy'
                }
              },
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value ($)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + Number(value).toLocaleString();
                }
              }
            }
          }
        }
      });
    };

    importChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, loading, error, title]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    if (!showEmptyState) {
      return null;
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-full w-full min-h-[260px]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
};
