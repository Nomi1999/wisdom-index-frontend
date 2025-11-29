'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileDetection } from '@/hooks/useMobileDetection';

// Import the metrics data from MetricCard
import metrics from './MetricCard';
import { MobileMetricDetail } from './MobileMetricDetail';

interface MobileDashboardProps {
  metricsData: Record<string, any>;
  loading: boolean;
  metricsLoaded: boolean;
  targetsLoaded: boolean;
  handleMetricCardClick: (metricName: string, category: string) => void;
}

// Category configuration with professional color palette
const categories = [
  {
    id: 'assets',
    name: 'Assets & Liabilities',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'emerald',
    gradient: 'from-emerald-700 via-emerald-800 to-emerald-900',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900'
  },
  {
    id: 'income',
    name: 'Income Analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'blue',
    gradient: 'from-blue-700 via-blue-800 to-blue-900',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  },
  {
    id: 'expenses',
    name: 'Expense Tracking',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'amber',
    gradient: 'from-amber-600 via-amber-700 to-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900'
  },
  {
    id: 'insurance',
    name: 'Insurance Coverage',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'rose',
    gradient: 'from-rose-700 via-rose-800 to-rose-900',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-900'
  },
  {
    id: 'planning',
    name: 'Future Planning',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'indigo',
    gradient: 'from-indigo-700 via-indigo-800 to-indigo-900',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900'
  },
  {
    id: 'wisdom-index',
    name: 'Wisdom Index',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'cyan',
    gradient: 'from-cyan-700 via-cyan-800 to-cyan-900',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-900'
  }
];

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  metricsData,
  loading,
  metricsLoaded,
  targetsLoaded,
  handleMetricCardClick
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<{ name: string; category: string } | null>(null);
  const { isMobile } = useMobileDetection();

  // Manage body scroll when category is expanded
  React.useEffect(() => {
    if (expandedCategory) {
      document.body.classList.add('category-open');
    } else {
      document.body.classList.remove('category-open');
    }

    return () => {
      document.body.classList.remove('category-open');
    };
  }, [expandedCategory]);

  // Don't render on desktop
  if (!isMobile) return null;

  // Group metrics by category
  const getMetricsByCategory = (categoryId: string) => {
    return metrics.filter(metric => metric && metric.category === categoryId);
  };

  // Format currency for mobile display
  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';

    const absValue = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
    if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
    if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
    return sign + '$' + absValue.toFixed(0);
  };

  // Format value based on type
  const formatValue = (value: any, isRatio: boolean) => {
    if (value === null || value === undefined) return '-';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';

    if (isRatio) {
      return numValue.toFixed(2);
    }
    return formatCurrency(numValue);
  };

  // Get status color for target indicators
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'above':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'below':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'equal':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Mobile metric card component
  const MobileMetricCard: React.FC<{
    metric: typeof metrics[0];
    metricData: any;
  }> = ({ metric, metricData }) => {
    if (!metric) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15)' }}
        onClick={() => setSelectedMetric({ name: metric.name, category: metric.category })}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:shadow-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-200"
      >
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-sm font-semibold text-slate-800 leading-tight">
            {metric.title}
          </h4>
          {metricData?.status && targetsLoaded && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(metricData.status)}`}>
              {metricData.target_display_text || 'No target'}
            </div>
          )}
        </div>
        
        <div className="text-lg font-bold text-slate-900 mb-2">
          {loading ? (
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse delay-75"></div>
              <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse delay-150"></div>
            </div>
          ) : (
            metricData?.formattedValue || '...'
          )}
        </div>

        {!loading && metricData?.target && (
          <div className="text-xs text-slate-500">
            Target: {formatValue(metricData.target, metric.isRatio)}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 pb-20 overflow-x-hidden overflow-y-auto mobile-dashboard-container" style={{ 
      width: '100vw', 
      maxWidth: '100vw', 
      minWidth: '100vw',
      position: 'relative',
      left: 0,
      right: 0,
      height: 'auto',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Main Dashboard View - Hidden when category is expanded */}
      {!expandedCategory && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: expandedCategory ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          

          {/* Quick Summary Card */}
          {!loading && metricsLoaded && (
            <div className="px-4 py-4 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-4 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Quick Overview</h3>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
<motion.div 
                   className="space-y-3"
                   initial="hidden"
                   animate="visible"
                   variants={{
                     hidden: { opacity: 0 },
                     visible: {
                       opacity: 1,
                       transition: {
                         staggerChildren: 0.1,
                         delayChildren: 0.2
                       }
                     }
                   }}
                 >
                   <motion.div 
                     className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                     variants={{
                       hidden: { opacity: 0, y: 10 },
                       visible: { opacity: 1, y: 0 }
                     }}
                   >
                     <span className="text-slate-100 text-sm font-medium">Net Worth</span>
                     <span className="text-xl font-bold text-white">
                       {metricsData['net-worth']?.formattedValue || '...'}
                     </span>
                   </motion.div>
                   <motion.div 
                     className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                     variants={{
                       hidden: { opacity: 0, y: 10 },
                       visible: { opacity: 1, y: 0 }
                     }}
                   >
                     <span className="text-slate-100 text-sm font-medium">Total Income</span>
                     <span className="text-xl font-bold text-white">
                       {metricsData['total-income']?.formattedValue || '...'}
                     </span>
                   </motion.div>
                   <motion.div 
                     className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                     variants={{
                       hidden: { opacity: 0, y: 10 },
                       visible: { opacity: 1, y: 0 }
                     }}
                   >
                     <span className="text-slate-100 text-sm font-medium">Total Expenses</span>
                     <span className="text-xl font-bold text-white">
                       {metricsData['total-expenses']?.formattedValue || '...'}
                     </span>
                   </motion.div>
                   <motion.div 
                     className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                     variants={{
                       hidden: { opacity: 0, y: 10 },
                       visible: { opacity: 1, y: 0 }
                     }}
                   >
                     <span className="text-slate-100 text-sm font-medium">Margin</span>
                     <span className="text-xl font-bold text-white">
                       {metricsData['margin']?.formattedValue || '...'}
                     </span>
                   </motion.div>
                 </motion.div>
              </motion.div>
            </div>
          )}

          {/* Categories List */}
          <div className="px-4 py-2 space-y-4 w-full max-w-full">
            {categories.map((category, index) => {
              const categoryMetrics = getMetricsByCategory(category.id);
              
              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full"
                >
                  {/* Category Header */}
                  <motion.button
                    layout
                    onClick={() => setExpandedCategory(category.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-4 py-4 flex items-center justify-between text-left bg-gradient-to-r ${category.gradient} text-white transition-all duration-200 active:scale-[0.98] shadow-sm min-w-full`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{category.name}</h3>
                        <p className="text-sm text-white/80">
                          {categoryMetrics.length} {categoryMetrics.length === 1 ? 'metric' : 'metrics'}
                        </p>
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ rotate: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-1"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Full Screen Category View */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            key={`category-${expandedCategory}`}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white overflow-hidden mobile-category-view"
            style={{ 
              width: '100vw', 
              height: '100vh',
              maxHeight: '100vh',
              overflow: 'hidden'
            }}
          >
            {(() => {
              const category = categories.find(c => c.id === expandedCategory);
              const categoryMetrics = getMetricsByCategory(expandedCategory);
              
              if (!category) return null;
              
              return (
                <div className="h-screen flex flex-col" style={{ height: '100vh', maxHeight: '100vh' }}>
                  {/* Category Header */}
                  <div className={`bg-gradient-to-r ${category.gradient} text-white px-4 py-6 shadow-lg flex-shrink-0`}>
                    <div className="flex items-center justify-between mb-4">
                      <motion.button
                        onClick={() => setExpandedCategory(null)}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-white/20 rounded-lg backdrop-blur-sm transition-colors active:bg-white/30"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </motion.button>
                      
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          {category.icon}
                        </div>
                        <div className="text-right">
                          <h2 className="text-xl font-bold text-white">{category.name}</h2>
                          <p className="text-sm text-white/80">
                            {categoryMetrics.length} {categoryMetrics.length === 1 ? 'metric' : 'metrics'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className={`flex-1 overflow-y-auto ${category.bgColor} mobile-category-content`} style={{ 
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    maxHeight: 'calc(100vh - 120px)' // Header height + bottom padding
                  }}>
                    <div className="p-4 space-y-4 pb-24">
                      <AnimatePresence mode="popLayout">
                        {categoryMetrics.map((metric, index) => (
                          <motion.div
                            key={metric?.name || `empty-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <MobileMetricCard
                              metric={metric}
                              metricData={metric ? metricsData[metric.name] : null}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-700 font-semibold text-lg">Loading your metrics...</p>
            <p className="text-slate-500 text-sm mt-2">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* Mobile Metric Detail View */}
      <MobileMetricDetail
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricName={selectedMetric?.name || ''}
        categoryName={selectedMetric?.category || ''}
        metricsData={metricsData}
      />
    </div>
  );
};

export default MobileDashboard;