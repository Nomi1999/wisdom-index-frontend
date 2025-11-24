'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TargetsManagerProps {
  loading: boolean;
  error: boolean;
  targetsData: Record<string, number>;
  saveTargetsLoading: boolean;
  resetTargetsLoading: boolean;
  saveTargetsSuccess: boolean;
  resetTargetsSuccess: boolean;
  showResetConfirmation: boolean;
  resetConfirmationClosing: boolean;
  loadTargetsData: () => void;
  saveTargets: () => void;
  handleResetAllTargets: () => void;
  confirmResetTargets: () => void;
  handleCloseResetConfirmation: () => void;
  updateTargetValue: (metricName: string, value: string) => void;
  deleteIndividualTarget: (metricName: string) => void;
  getTargetStatusHTML: (
    actualValue: number | null | undefined,
    targetValue: number | null | undefined
  ) => string;
  metricsByCategory: Record<string, any[]>;
  metricsData: Record<string, any>;
  discardChanges: () => void;
}

const getCategoryColor = (category: string) => {
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('asset')) return 'border-l-blue-950 text-blue-950';
  if (lowerCat.includes('income')) return 'border-l-blue-900 text-blue-900';
  if (lowerCat.includes('expense')) return 'border-l-blue-800 text-blue-800';
  if (lowerCat.includes('insurance')) return 'border-l-blue-700 text-blue-700';
  if (lowerCat.includes('planning')) return 'border-l-blue-600 text-blue-600';
  if (lowerCat.includes('wisdom')) return 'border-l-blue-500 text-blue-500';
  return 'border-l-gray-500 text-gray-700';
};

const getCategoryBg = (category: string) => {
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('asset')) return 'bg-blue-50/50';
  if (lowerCat.includes('income')) return 'bg-blue-50/40';
  if (lowerCat.includes('expense')) return 'bg-blue-50/30';
  if (lowerCat.includes('insurance')) return 'bg-blue-50/20';
  if (lowerCat.includes('planning')) return 'bg-blue-50/10';
  if (lowerCat.includes('wisdom')) return 'bg-blue-50/5';
  return 'bg-gray-50/50';
};

export const TargetsManager: React.FC<TargetsManagerProps> = ({
  loading,
  error,
  targetsData,
  saveTargetsLoading,
  resetTargetsLoading,
  saveTargetsSuccess,
  resetTargetsSuccess,
  showResetConfirmation,
  resetConfirmationClosing,
  loadTargetsData,
  saveTargets,
  handleResetAllTargets,
  confirmResetTargets,
  handleCloseResetConfirmation,
  updateTargetValue,
  deleteIndividualTarget,
  getTargetStatusHTML,
  metricsByCategory,
  metricsData,
  discardChanges
}) => {
  const formatValue = (value: any, isRatio: boolean) => {
    if (value === null || value === undefined) return '-';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';

    if (isRatio) {
      if (numValue >= 1000000) return (numValue / 1000000).toFixed(1) + 'm';
      if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'k';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    }

    return formatCurrency(numValue);
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';

    const absValue = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'b';
    if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'm';
    if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'k';
    return sign + '$' + absValue.toFixed(0);
  };

  // Container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Modern Header Section */}
        <header className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
           {/* Decorative background accent */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60 pointer-events-none"></div>
           
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Targets</h1>
            <p className="text-gray-500 mt-2 text-base max-w-2xl">
              Set personalized goals for your financial metrics. These targets drive your Wisdom Index and help track your progress towards financial freedom.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
             <button
              className="bg-white text-gray-600 border border-gray-200 py-2.5 px-5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm"
              onClick={discardChanges}
            >
              Revert Changes
            </button>
            
            <button
              className={`bg-white border border-red-200 text-red-600 py-2.5 px-5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-red-50 hover:border-red-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                resetTargetsSuccess ? 'bg-green-50 border-green-200 text-green-700' : ''
              }`}
              onClick={handleResetAllTargets}
              disabled={resetTargetsLoading || resetTargetsSuccess}
            >
               {resetTargetsLoading ? (
                 <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
               ) : resetTargetsSuccess ? (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
               )}
              {resetTargetsLoading ? 'Resetting...' : resetTargetsSuccess ? 'Reset Complete' : 'Reset All'}
            </button>
           
            <button
              className={`bg-blue-900 text-white py-2.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-blue-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 ${
                saveTargetsSuccess ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              onClick={saveTargets}
              disabled={saveTargetsLoading || saveTargetsSuccess}
            >
              {saveTargetsLoading ? (
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : saveTargetsSuccess ? (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              )}
              {saveTargetsLoading ? 'Saving...' : saveTargetsSuccess ? 'Changes Saved' : 'Save Targets'}
            </button>
          </div>
        </header>

        <main className="">
          {loading && (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin mb-6" />
              <p className="text-gray-500 font-medium">Loading your financial targets...</p>
            </div>
          )}

          {!loading && !error && (
            <motion.div 
              className="grid grid-cols-1 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => {
                 const categoryColor = getCategoryColor(category);
                 const categoryBg = getCategoryBg(category);
                 
                 return (
                <motion.section 
                  key={category} 
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-gray-200/75 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${categoryBg}`}>
                    <div className={`pl-3 border-l-4 ${categoryColor}`}>
                      <h3 className={`text-lg font-bold tracking-tight ${categoryColor.split(' ')[1]}`}>{category}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryMetrics.map((metric) => {
                      const currentValue = metricsData[metric.name]?.value || 0;
                      const targetValue = targetsData[metric.name];
                      const actualValue = currentValue ? formatValue(currentValue, metric.isRatio) : '-';
                      const isTargetSet = targetValue !== undefined && targetValue !== null;
                      const statusHtml = getTargetStatusHTML(currentValue, targetValue);

                      return (
                        <div
                          key={metric.name}
                          className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <label className="font-semibold text-gray-700 text-sm leading-tight" htmlFor={`target-${metric.name}`}>
                              {metric.title}
                            </label>
                            <div className="flex items-center px-2 py-1 rounded-md bg-white border border-gray-100 text-xs shadow-sm">
                              <span className="text-gray-400 mr-1.5">Current:</span>
                              <span className="font-bold text-gray-900">{actualValue}</span>
                            </div>
                          </div>

                          <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 sm:text-sm">
                                    {metric.isRatio ? '%' : '$'}
                                </span>
                            </div>
                            <input
                              type="number"
                              id={`target-${metric.name}`}
                              name={metric.name}
                              value={targetValue ?? ''}
                              onChange={(e) => updateTargetValue(metric.name, e.target.value)}
                              placeholder={isTargetSet ? String(targetValue) : "Set target"}
                              step={metric.isRatio ? "0.1" : "100"}
                              className={`w-full pl-8 pr-10 py-2.5 border rounded-lg text-sm transition-all duration-200 outline-none ${
                                isTargetSet 
                                  ? 'bg-white border-blue-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100' 
                                  : 'bg-gray-50 border-gray-200 text-gray-500 focus:bg-white focus:border-blue-400 focus:text-gray-900 focus:ring-2 focus:ring-blue-50'
                              }`}
                            />
                            
                             {isTargetSet && (
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                                onClick={() => deleteIndividualTarget(metric.name)}
                                aria-label="Remove target"
                              >
                                <div className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                              </button>
                            )}
                          </div>
                          
                          {/* Status Indicator */}
                          <div className="min-h-[24px] flex items-center">
                            {isTargetSet ? (
                                <div
                                  className="text-xs font-medium px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 w-full justify-center bg-gray-100 text-gray-600"
                                  dangerouslySetInnerHTML={{
                                    __html: statusHtml.replace(/class="/g, 'class="flex items-center gap-1 ') // Naive injection to flex the inner content if needed, but mostly relying on the passed HTML
                                  }}
                                />
                            ) : (
                                <span className="text-xs text-gray-400 italic px-2">No target set</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              )})}
            </motion.div>
          )}

          {error && (
             <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100 shadow-sm">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load targets</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">We encountered an issue while retrieving your financial targets. Please check your connection and try again.</p>
              <button
                className="bg-blue-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                onClick={loadTargetsData}
              >
                Retry Loading
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-[1200] bg-gray-900/60 backdrop-blur-sm transition-all duration-300 ${
            resetConfirmationClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseResetConfirmation();
            }
          }}
        >
          <div
            className={`w-11/12 max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
              resetConfirmationClosing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <header className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Confirm Reset</h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
                onClick={handleCloseResetConfirmation}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </header>
            <main className="p-8 text-center">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
               </div>
              <p className="text-gray-600 leading-relaxed">
                Are you sure you want to <span className="font-bold text-gray-900">reset all targets</span>? 
                <br/>
                This action cannot be undone and all your custom goals will be lost.
              </p>
            </main>
            <footer className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                className="bg-white border border-gray-300 text-gray-700 py-2.5 px-5 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                onClick={handleCloseResetConfirmation}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-red-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                onClick={confirmResetTargets}
              >
                Yes, Reset Everything
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};