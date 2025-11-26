import React from 'react';
import { motion } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  if (lowerCat.includes('asset')) return 'bg-gradient-to-br from-blue-50/80 to-blue-100/40';
  if (lowerCat.includes('income')) return 'bg-gradient-to-br from-blue-50/70 to-blue-100/30';
  if (lowerCat.includes('expense')) return 'bg-gradient-to-br from-blue-50/60 to-blue-100/20';
  if (lowerCat.includes('insurance')) return 'bg-gradient-to-br from-blue-50/50 to-blue-100/10';
  if (lowerCat.includes('planning')) return 'bg-gradient-to-br from-blue-50/40 to-slate-50/20';
  if (lowerCat.includes('wisdom')) return 'bg-gradient-to-br from-blue-50/30 to-slate-50/10';
  return 'bg-gradient-to-br from-gray-50/60 to-gray-100/20';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'above': return 'bg-green-50 text-green-700 border-green-200';
    case 'below': return 'bg-red-50 text-red-700 border-red-200';
    case 'equal': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
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

  // Add a helper function to get progress percentage for visual indicators
  const getProgressPercentage = (current: number, target: number) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  // Enhanced container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
         {/* Enhanced Header Section */}
         <header className="bg-white rounded-2xl shadow-lg border border-blue-100/50 p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-sm">
            {/* Enhanced decorative background accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 opacity-60 pointer-events-none"></div>
            
           <div className="relative z-10">
             <h1 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-blue-950 to-blue-700 bg-clip-text text-transparent">
               Financial Targets
             </h1>
             <p className="text-gray-600 mt-1 text-sm max-w-2xl leading-relaxed">
               Set personalized goals for your financial metrics. These targets drive your Wisdom Index and help track your progress towards financial freedom.
             </p>
           </div>
          
           <div className="flex items-center gap-2 relative z-10 flex-nowrap shrink-0 overflow-x-auto pb-1 sm:pb-0">
              <button
               className="bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200/80 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-white hover:text-gray-900 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 shadow-sm group whitespace-nowrap"
               onClick={discardChanges}
             >
               <span className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                 </svg>
                 Revert
               </span>
             </button>
             
             <button
               className={`bg-white/80 backdrop-blur-sm border border-red-200/80 text-red-600 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-red-50/80 hover:border-red-300/80 hover:shadow-md hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group whitespace-nowrap ${
                 resetTargetsSuccess ? 'bg-green-50/80 border-green-200/80 text-green-700' : ''
               }`}
               onClick={handleResetAllTargets}
               disabled={resetTargetsLoading || resetTargetsSuccess}
             >
                {resetTargetsLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : resetTargetsSuccess ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                )}
               {resetTargetsLoading ? 'Resetting...' : resetTargetsSuccess ? 'Reset' : 'Reset All'}
             </button>
            
             <button
               className={`bg-gradient-to-r from-blue-900 to-blue-800 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 hover:from-blue-800 hover:to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 group whitespace-nowrap ${
                 saveTargetsSuccess ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : ''
               }`}
               onClick={saveTargets}
               disabled={saveTargetsLoading || saveTargetsSuccess}
             >
               {saveTargetsLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               ) : saveTargetsSuccess ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
               ) : (
                  <svg className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                  </svg>
               )}
               {saveTargetsLoading ? 'Saving...' : saveTargetsSuccess ? 'Saved' : 'Save Targets'}
             </button>
           </div>
        </header>

        <main className="">
           {loading && (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-sm">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin mb-6"></div>
                 <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-600 rounded-full animate-spin opacity-30"></div>
               </div>
               <p className="text-gray-600 font-medium text-lg">Loading your financial targets...</p>
               <p className="text-gray-400 text-sm mt-2">Preparing your personalized goals</p>
             </div>
           )}

          {!loading && !error && (
            <motion.div 
              className="grid grid-cols-1 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
               {Object.entries(metricsByCategory).map(([category, categoryMetrics], index) => {
                  const categoryColor = getCategoryColor(category);
                  const categoryBg = getCategoryBg(category);
                  
                  return (
                   <motion.section 
                     key={category} 
                     className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden backdrop-blur-sm group"
                     initial={{ opacity: 0, y: 30, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     transition={{ type: "spring" as const, stiffness: 100, damping: 15, delay: index * 0.1 }}
                     whileHover={{ y: -2 }}
                  >
                   <div className={`px-8 py-6 border-b border-gray-100/80 flex items-center justify-between ${categoryBg} relative overflow-hidden`}>
                     <div className={`pl-4 border-l-4 ${categoryColor}`}>
                       <h3 className={`text-xl font-bold tracking-tight ${categoryColor.split(' ')[1]} group-hover:scale-105 transition-transform duration-200`}>
                         {category}
                       </h3>
                       <p className="text-sm text-gray-500 mt-1">Set targets for {category.toLowerCase()} metrics</p>
                     </div>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl opacity-50"></div>
                   </div>
                  
                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     {categoryMetrics.map((metric) => {
                       const currentValue = metricsData[metric.name]?.value || 0;
                       const targetValue = targetsData[metric.name];
                       const actualValue = currentValue ? formatValue(currentValue, metric.isRatio) : '-';
                       const isTargetSet = targetValue !== undefined && targetValue !== null;
                       const statusHtml = getTargetStatusHTML(currentValue, targetValue);
                       const statusType = currentValue && targetValue ? 
                         (currentValue >= targetValue ? 'above' : 'below') : 'none';

                       return (
                          <motion.div
                            key={metric.name}
                            className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 hover:from-white hover:to-blue-50/30 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md group/card"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                          >
                           <div className="flex justify-between items-start gap-3">
                             <label className="font-bold text-gray-800 text-sm leading-tight flex-1" htmlFor={`target-${metric.name}`}>
                               {metric.title}
                             </label>
                             <div className="flex items-center px-3 py-1.5 rounded-lg bg-white border border-gray-200/80 text-xs shadow-sm group-hover/card:border-blue-200 transition-colors">
                               <span className="text-gray-500 mr-2">Current:</span>
                               <span className="font-bold text-gray-900">{actualValue}</span>
                             </div>
                           </div>

                           <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                 <span className="text-gray-400 font-medium">
                                     {metric.isRatio ? '%' : '$'}
                                 </span>
                             </div>
                             <input
                               type="number"
                               id={`target-${metric.name}`}
                               name={metric.name}
                               value={targetValue ?? ''}
                               onChange={(e) => updateTargetValue(metric.name, e.target.value)}
                               placeholder={isTargetSet ? String(targetValue) : "Set your target"}
                               step={metric.isRatio ? "0.1" : "100"}
                               className={`w-full pl-10 pr-12 py-3 border rounded-xl text-sm transition-all duration-200 outline-none backdrop-blur-sm ${
                                 isTargetSet 
                                   ? 'bg-white/80 border-blue-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 focus:bg-white' 
                                   : 'bg-gray-50/50 border-gray-200 text-gray-500 focus:bg-white focus:border-blue-400 focus:text-gray-900 focus:ring-4 focus:ring-blue-50/50'
                               }`}
                             />
                             
                              {isTargetSet && (
                               <button
                                 type="button"
                                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                 onClick={() => deleteIndividualTarget(metric.name)}
                                 aria-label="Remove target"
                               >
                                 <div className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                     </svg>
                                 </div>
                               </button>
                             )}
                           </div>
                           
                           {/* Enhanced Status Indicator with Progress Bar */}
                           <div className="space-y-3">
                             {isTargetSet && currentValue && targetValue && (
                               <div className="space-y-2">
                                 <div className="flex justify-between text-xs text-gray-600">
                                   <span>Progress</span>
                                   <span>{getProgressPercentage(currentValue, targetValue).toFixed(0)}%</span>
                                 </div>
                                 <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                                   <motion.div 
                                     className={`h-2 rounded-full transition-all duration-500 ${
                                       statusType === 'above' ? 'bg-green-500' :
                                       statusType === 'below' ? 'bg-red-500' :
                                       'bg-yellow-500'
                                     }`}
                                     initial={{ width: 0 }}
                                     animate={{ width: `${getProgressPercentage(currentValue, targetValue)}%` }}
                                     transition={{ duration: 0.8, ease: "easeOut" }}
                                   />
                                 </div>
                               </div>
                             )}
                             
                             <div className="min-h-[32px] flex items-center">
                               {isTargetSet ? (
                                   <div
                                     className={`text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-2 w-full justify-center border transition-all duration-200 ${
                                       statusType === 'above' ? 'bg-green-50 text-green-700 border-green-200' :
                                       statusType === 'below' ? 'bg-red-50 text-red-700 border-red-200' :
                                       'bg-yellow-50 text-yellow-700 border-yellow-200'
                                     }`}
                                     dangerouslySetInnerHTML={{
                                       __html: statusHtml.replace(/class="/g, 'class="flex items-center gap-1.5 ')
                                     }}
                                   />
                               ) : (
                                   <div className="text-xs text-gray-400 italic px-3 py-2 rounded-lg bg-gray-50/50 border border-gray-100 w-full text-center">
                                     No target set - click to add your goal
                                   </div>
                               )}
                             </div>
                           </div>
                         </motion.div>
                       );
                     })}
                   </div>
                </motion.section>
              )})}
            </motion.div>
          )}

           {error && (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100/50 shadow-lg backdrop-blur-sm">
               <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-3">Failed to load targets</h3>
               <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                 We encountered an issue while retrieving your financial targets. Please check your connection and try again.
               </p>
               <button
                 className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-800 hover:to-blue-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                 onClick={loadTargetsData}
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                 </svg>
                 Retry Loading
               </button>
             </div>
           )}
        </main>
      </div>

      {/* Enhanced Reset Confirmation Modal - Replaced with standard ConfirmDialog */}
      <ConfirmDialog
        isOpen={showResetConfirmation}
        onClose={handleCloseResetConfirmation}
        onConfirm={confirmResetTargets}
        title="Confirm Reset"
        description="Are you sure you want to reset all targets? This action cannot be undone and all your custom goals will be permanently lost."
        confirmText="Yes, Reset Everything"
        cancelText="Cancel"
      />
    </>
  );
};