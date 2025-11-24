'use client';

import React from 'react';

// Tooltip styles - self-contained in the component
const tooltipStyles = `
  [data-tooltip] {
    position: relative;
  }
  
  [data-tooltip]:hover::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1f2937;
    color: #f9fafb;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    z-index: 50;
    pointer-events: none;
    margin-bottom: 0.25rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
  
  [data-tooltip]:hover::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1f2937;
    z-index: 50;
    pointer-events: none;
    margin-bottom: -0.125rem;
  }
`;

// Metric definitions
const metrics = [
  // Row 1: Assets & Liabilities (7 cards - all dark blue shades - darkest)
  { name: 'net-worth', title: 'Net Worth', category: 'assets', isRatio: false },
  { name: 'portfolio-value', title: 'Portfolio Value', category: 'assets', isRatio: false },
  { name: 'real-estate-value', title: 'Real Estate', category: 'assets', isRatio: false },
  { name: 'debt', title: 'Debt', category: 'assets', isRatio: false },
  { name: 'equity', title: 'Equity', category: 'assets', isRatio: false },
  { name: 'fixed-income', title: 'Fixed Income', category: 'assets', isRatio: false },
  { name: 'cash', title: 'Cash', category: 'assets', isRatio: false },

  // Row 2: Income (6 cards - all dark blue shades - very dark)
  { name: 'earned-income', title: 'Earned Income', category: 'income', isRatio: false },
  { name: 'social-security-income', title: 'Social Security', category: 'income', isRatio: false },
  { name: 'pension-income', title: 'Pension', category: 'income', isRatio: false },
  { name: 'real-estate-income', title: 'RE Income', category: 'income', isRatio: false },
  { name: 'business-income', title: 'Business Inc', category: 'income', isRatio: false },
  { name: 'total-income', title: 'Total Income', category: 'income', isRatio: false },
  null, // Empty card

  // Row 3: Expenses (7 cards - all dark blue shades - dark)
  { name: 'current-year-giving', title: 'Giving', category: 'expenses', isRatio: false },
  { name: 'current-year-savings', title: 'Savings', category: 'expenses', isRatio: false },
  { name: 'current-year-debt', title: 'Debt Payments', category: 'expenses', isRatio: false },
  { name: 'current-year-taxes', title: 'Taxes', category: 'expenses', isRatio: false },
  { name: 'current-year-living-expenses', title: 'Living Exp', category: 'expenses', isRatio: false },
  { name: 'total-expenses', title: 'Total Exp', category: 'expenses', isRatio: false },
  { name: 'margin', title: 'Margin', category: 'expenses', isRatio: false },

  // Row 4: Insurance (7 cards - all dark blue shades - medium-dark)
  { name: 'life-insurance', title: 'Life Ins', category: 'insurance', isRatio: false },
  { name: 'disability', title: 'Disability', category: 'insurance', isRatio: false },
  { name: 'ltc', title: 'LTC', category: 'insurance', isRatio: false },
  { name: 'umbrella', title: 'Umbrella', category: 'insurance', isRatio: false },
  { name: 'business-insurance', title: 'Business Ins', category: 'insurance', isRatio: false },
  { name: 'flood-insurance', title: 'Flood Ins', category: 'insurance', isRatio: false },
  { name: 'at-risk', title: 'At Risk', category: 'insurance', isRatio: false },

  // Row 5: Future Planning (6 cards - all dark blue shades - medium + 1 empty)
  { name: 'retirement-ratio', title: 'Retirement', category: 'planning', isRatio: true },
  { name: 'survivor-ratio', title: 'Survivor', category: 'planning', isRatio: true },
  { name: 'education-ratio', title: 'Education', category: 'planning', isRatio: true },
  { name: 'new-cars-ratio', title: 'New Cars', category: 'planning', isRatio: true },
  { name: 'ltc-ratio', title: 'LTC Ratio', category: 'planning', isRatio: true },
  { name: 'ltd-ratio', title: 'LTD Ratio', category: 'planning', isRatio: true },
  null, // Empty card

  // Row 6: Wisdom Index Ratios (5 cards - all dark blue shades - medium + 2 empty)
  { name: 'savings-ratio', title: 'Savings Ratio', category: 'wisdom-index', isRatio: true },
  { name: 'giving-ratio', title: 'Giving Ratio', category: 'wisdom-index', isRatio: true },
  { name: 'reserves-ratio', title: 'Reserves', category: 'wisdom-index', isRatio: true },
  { name: 'debt-ratio', title: 'Debt Ratio', category: 'wisdom-index', isRatio: true },
  { name: 'diversification-ratio', title: 'Diversification', category: 'wisdom-index', isRatio: true },
  null, // Empty card
  null, // Empty card
];

interface MetricCardProps {
  metric: typeof metrics[0];
  index: number;
  metricsData: Record<string, any>;
  loading: boolean;
  metricsLoaded: boolean;
  targetsLoaded: boolean;
  handleMetricCardClick: (metricName: string, category: string) => void;
  isInitialLoad: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  index,
  metricsData,
  loading,
  metricsLoaded,
  targetsLoaded,
  handleMetricCardClick,
  isInitialLoad
}) => {
  // Inject tooltip styles
  React.useEffect(() => {
    const styleId = 'metric-card-tooltip-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = tooltipStyles;
      document.head.appendChild(style);
    }
  }, []);

  if (metric === null) {
    return <div key={`empty-${index}`} className="invisible pointer-events-none"></div>;
  }

  const metricData = metricsData[metric.name];

  return (
    <article
      key={metric.name}
      className={`group p-2 sm:p-2.5 lg:p-3 xl:p-4 rounded-lg shadow-md text-center transition-all duration-300 ease-out relative overflow-hidden border-l-4 h-full flex flex-col justify-center items-center cursor-pointer bg-white backdrop-blur-sm ${loading ? '' : 'hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02]'} ${isInitialLoad ? '' : ''} ${metric.category === 'assets' ? 'border-l-blue-950 hover:border-l-blue-900 hover:shadow-blue-100' :
          metric.category === 'income' ? 'border-l-blue-900 hover:border-l-blue-800 hover:shadow-blue-100' :
            metric.category === 'expenses' ? 'border-l-blue-800 hover:border-l-blue-700 hover:shadow-blue-100' :
              metric.category === 'insurance' ? 'border-l-blue-700 hover:border-l-blue-600 hover:shadow-blue-100' :
                metric.category === 'planning' ? 'border-l-blue-600 hover:border-l-blue-500 hover:shadow-blue-100' :
                  metric.category === 'wisdom-index' ? 'border-l-blue-600 hover:border-l-blue-500 hover:shadow-blue-100' :
                    'border-l-gray-400 hover:border-l-gray-500'
        } ${metric.category === 'assets' ? 'border-blue-200 hover:border-blue-300' :
          metric.category === 'income' ? 'border-blue-200 hover:border-blue-300' :
            metric.category === 'expenses' ? 'border-blue-200 hover:border-blue-300' :
              metric.category === 'insurance' ? 'border-blue-200 hover:border-blue-300' :
                metric.category === 'planning' ? 'border-blue-200 hover:border-blue-300' :
                  metric.category === 'wisdom-index' ? 'border-blue-200 hover:border-blue-300' :
                    'border-gray-200'
        }`}
      data-metric={metric.name}
      data-category={metric.category}
      onClick={() => handleMetricCardClick(metric.name, metric.category)}
      title="Click to view detailed information"
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Subtle background gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none ${metric.category === 'assets' ? 'bg-gradient-to-br from-blue-800 to-blue-950' :
          metric.category === 'income' ? 'bg-gradient-to-br from-blue-700 to-blue-900' :
            metric.category === 'expenses' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
              metric.category === 'insurance' ? 'bg-gradient-to-br from-blue-600 to-blue-700' :
                metric.category === 'planning' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                  metric.category === 'wisdom-index' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                    'bg-gradient-to-br from-gray-400 to-gray-600'
        }`}></div>

      <h3 className="text-gray-700 mb-1 sm:mb-1 lg:mb-1.5 xl:mb-2 text-[8px] sm:text-[9px] lg:text-[10px] xl:text-xs font-semibold uppercase tracking-tight leading-none block truncate w-full transition-colors duration-200 group-hover:text-gray-900 relative z-10" title={metric.title}>
        {metric.title}
      </h3>
      <div className="w-full relative z-10">
        {loading ? (
          <div className="relative flex flex-col items-center gap-1 py-1 overflow-hidden rounded-sm bg-gray-100">
            <div className="h-3 sm:h-3.5 w-2/3 rounded-full bg-gray-300"></div>
            <div className="h-2.5 sm:h-3 w-1/3 rounded-full bg-gray-200"></div>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-y-0 -left-1/2 w-2/3 bg-gradient-to-r from-white/0 via-white/80 to-white/0 opacity-90 blur-lg animate-metric-shimmer"
                style={{ willChange: 'transform' }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-gray-900 mb-0 leading-tight block truncate w-full transition-all duration-200 group-hover:scale-105 relative z-10">
            {metricData?.formattedValue || '...'}
          </div>
        )}
      </div>
      {/* Show target indicator only after targets are loaded */}
      {!loading && targetsLoaded && (
        <div
          className={`mt-1 sm:mt-1 lg:mt-1.5 xl:mt-2 text-[7px] sm:text-[8px] lg:text-[10px] xl:text-xs font-semibold py-0.5 sm:py-1 lg:py-1 xl:py-1 px-1.5 sm:px-2 lg:px-2.5 xl:px-3 rounded-md inline-flex items-center justify-center min-w-5 sm:min-w-6 lg:min-w-8 xl:min-w-10 whitespace-nowrap transition-all duration-200 shadow-sm cursor-help relative z-10 ${metricData?.status === 'above' ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100' : metricData?.status === 'below' ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100' : metricData?.status === 'equal' ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}
          data-tooltip={metricData?.target ? `Target: ${formatValue(metricData.target, metric.isRatio)}` : 'No target set'}
        >
          {metricData?.target_display_text || 'No target'}
        </div>
      )}
      {/* Show loading state for targets after metrics are loaded but targets aren't loaded yet */}
      {!loading && metricsLoaded && !targetsLoaded && (
        <div className="mt-1 sm:mt-1 lg:mt-1.5 xl:mt-2 h-4 sm:h-5 w-16 sm:w-20 rounded-md bg-gray-200 relative overflow-hidden z-10">
          <div
            className="absolute inset-y-0 -left-1/2 w-full bg-gradient-to-r from-white/0 via-white/80 to-white/0 opacity-90 blur-md animate-metric-shimmer"
            style={{ willChange: 'transform' }}
          ></div>
        </div>
      )}
    </article>
  );
};

// Helper function for formatting values
const formatValue = (value: any, isRatio: boolean) => {
  if (value === null || value === undefined) return '-';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '-';

  if (isRatio) {
    // For ratio metrics (future planning + wisdom index), show decimal values instead of currency
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  } else {
    return formatCurrency(numValue);
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';

  const absValue = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'b';
  if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'm';
  if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'k';
  return sign + '$' + absValue.toFixed(0);
};

export default metrics;
