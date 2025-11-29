'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { WisdomIndexBarChart } from './WisdomIndexBarChart';
import { TreemapChart } from './TreemapChart';
import { SimpleIncomeBarChart } from './SimpleIncomeBarChart';
import { SimpleExpensePieChart } from './SimpleExpensePieChart';

interface MobileChartsViewProps {
  authToken: string | null;
  clientId?: number | null;
  comparisonClientId?: number | null;
}

export const MobileChartsView: React.FC<MobileChartsViewProps> = ({
  authToken,
  clientId = null,
  comparisonClientId = null
}) => {
  const { isMobile } = useMobileDetection();

  // Don't render on desktop
  if (!isMobile) return null;

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 safe-area-pt">
      

      {/* Charts Container */}
      <div className="px-4 py-4 space-y-4">
        <AnimatePresence>
          {/* Wisdom Index Bar Chart */}
          <motion.div
            key="wisdom-index"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="h-80"
          >
            <WisdomIndexBarChart
              authToken={authToken}
              compact={false}
              clientId={clientId}
              comparisonClientId={comparisonClientId}
            />
          </motion.div>

          {/* Asset Allocation Treemap */}
          <motion.div
            key="asset-allocation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-80"
          >
            <TreemapChart
              authToken={authToken}
              compact={false}
              clientId={clientId}
              comparisonClientId={comparisonClientId}
            />
          </motion.div>

          {/* Income Bar Chart */}
          <motion.div
            key="income-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-80"
          >
            <SimpleIncomeBarChart
              authToken={authToken}
              compact={false}
              clientId={clientId}
              comparisonClientId={comparisonClientId}
            />
          </motion.div>

          {/* Expense Pie Chart */}
          <motion.div
            key="expense-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-80"
          >
            <SimpleExpensePieChart
              authToken={authToken}
              compact={false}
              clientId={clientId}
              comparisonClientId={comparisonClientId}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Loading State */}
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center" style={{ display: 'none' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading charts...</p>
        </div>
      </div>
    </div>
  );
};

export default MobileChartsView;