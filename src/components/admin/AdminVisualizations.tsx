'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, ArrowRightLeft, BarChart3, PieChart, TreePine, DollarSign, Target, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientSelector } from './ClientSelector';
import { ClientComparisonSelector } from './ClientComparisonSelector';
import { TreemapChart } from '../dashboard/TreemapChart';
import { WisdomIndexBarChart } from '../dashboard/WisdomIndexBarChart';
import { SimpleIncomeBarChart } from '../dashboard/SimpleIncomeBarChart';
import { SimpleExpensePieChart } from '../dashboard/SimpleExpensePieChart';

interface Client {
  client_id: number;
  client_name?: string;
  first_name: string;
  last_name: string;
  email?: string;
  username?: string;
  has_account: boolean;
}

interface AdminVisualizationsProps {
  authToken: string | null;
}

export const AdminVisualizations: React.FC<AdminVisualizationsProps> = ({
  authToken
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [gridLayout, setGridLayout] = useState<'standard' | 'compact' | 'ultra-compact'>('standard');
  
  // State for single client mode
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // State for comparison mode
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedComparisonClients, setSelectedComparisonClients] = useState<[Client | null, Client | null]>([null, null]);

  // Calculate viewport height and determine layout mode
  useEffect(() => {
    const calculateViewportHeight = () => {
      const height = window.innerHeight;
      setViewportHeight(height);
      
      // Determine layout mode based on viewport height
      if (height <= 768) { // Typical laptop screens and below
        setGridLayout('ultra-compact');
        setIsCompactMode(true);
      } else if (height <= 900) { // Small desktop/laptop
        setGridLayout('compact');
        setIsCompactMode(true);
      } else { // Large desktop
        setGridLayout('standard');
        setIsCompactMode(false);
      }
    };

    calculateViewportHeight();
    
    // Add resize listener with debouncing
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateViewportHeight, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Calculate dynamic spacing based on viewport height
  const getDynamicSpacing = () => {
    if (viewportHeight <= 768) {
      return {
        headerMargin: 'mb-1',
        headerPadding: 'p-1',
        gap: 'gap-1',
        cardPadding: 'p-2'
      };
    } else if (viewportHeight <= 900) {
      return {
        headerMargin: 'mb-1.5',
        headerPadding: 'p-1.5',
        gap: 'gap-1.5',
        cardPadding: 'p-2.5'
      };
    } else {
      return {
        headerMargin: 'mb-2',
        headerPadding: 'p-2',
        gap: 'gap-2',
        cardPadding: 'p-3'
      };
    }
  };

  const spacing = getDynamicSpacing();

  // Get grid configuration based on layout mode
  const getGridConfig = () => {
    switch (gridLayout) {
      case 'ultra-compact':
        return {
          className: 'grid grid-cols-2 grid-rows-2 gap-1 min-h-0',
          headerHeight: 'h-8',
          chartHeight: 'h-full'
        };
      case 'compact':
        return {
          className: 'grid grid-cols-4 grid-rows-2 gap-1.5 min-h-0',
          headerHeight: 'h-10',
          chartHeight: 'h-full'
        };
      default:
        return {
          className: 'grid grid-cols-4 grid-rows-2 gap-2 min-h-0',
          headerHeight: 'h-12',
          chartHeight: 'h-full'
        };
    }
  };

  const gridConfig = getGridConfig();

  // Determine active client(s) for charts
  const activeClientId = isComparisonMode ? selectedComparisonClients[0]?.client_id : selectedClient?.client_id;
  const comparisonClientId = isComparisonMode ? selectedComparisonClients[1]?.client_id : null;
  const hasValidSelection = isComparisonMode 
    ? (!!selectedComparisonClients[0] && !!selectedComparisonClients[1]) 
    : !!selectedClient;

  const handleToggleComparison = () => {
    if (!isComparisonMode) {
      // Switching TO comparison mode
      // Initialize first client with currently selected client if available
      setSelectedComparisonClients([selectedClient, null]);
    } else {
      // Switching FROM comparison mode
      // Keep the first client as the selected client
      if (selectedComparisonClients[0]) {
        setSelectedClient(selectedComparisonClients[0]);
      }
    }
    setIsComparisonMode(!isComparisonMode);
  };

  React.useEffect(() => {
    console.log('[AdminVisualizations] Component mounted, authToken:', authToken ? 'exists' : 'missing');
    console.log('[AdminVisualizations] Viewport height:', viewportHeight, 'Layout mode:', gridLayout);
    console.log('[AdminVisualizations] Mode:', isComparisonMode ? 'Comparison' : 'Single');
  }, [authToken, viewportHeight, gridLayout, isComparisonMode]);

  // Enhanced surface styling matching admin dashboard theme
  const elevatedSurface = 'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-sm';
  
  // Chart type configurations with enhanced styling
  const chartConfigs = [
    {
      id: 'wisdom-index',
      title: 'Wisdom Index Ratios',
      subtitle: 'Financial planning ratios analysis',
      icon: BarChart3,
      iconAccent: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      description: 'Comprehensive view of retirement, survivor, education, and other key financial ratios'
    },
    {
      id: 'asset-allocation',
      title: 'Asset Allocation',
      subtitle: 'Portfolio diversification analysis',
      icon: TreePine,
      iconAccent: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      description: 'Treemap visualization of asset distribution across holdings, real estate, and investments'
    },
    {
      id: 'income-analysis',
      title: 'Income Analysis',
      subtitle: 'Income sources breakdown',
      icon: DollarSign,
      iconAccent: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20',
      gradient: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
      description: 'Detailed breakdown of earned income, Social Security, pension, and other income sources'
    },
    {
      id: 'expense-breakdown',
      title: 'Expense Breakdown',
      subtitle: 'Spending patterns analysis',
      icon: PieChart,
      iconAccent: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
      description: 'Visual analysis of giving, savings, debt, taxes, living expenses, and overall margin'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Client Selector Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            {isComparisonMode ? 'Client Comparison' : 'Client Selection'}
          </h3>
          {isComparisonMode && (
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
              <Target className="h-4 w-4" />
              <span>Select 2 clients to compare</span>
            </div>
          )}
        </div>

        {isComparisonMode ? (
          <ClientComparisonSelector
            authToken={authToken}
            onClientsChange={setSelectedComparisonClients}
            selectedClients={selectedComparisonClients}
            onToggleComparison={handleToggleComparison}
          />
        ) : (
          <ClientSelector
            authToken={authToken}
            onClientChange={setSelectedClient}
            selectedClient={selectedClient}
            onToggleComparison={handleToggleComparison}
          />
        )}
      </motion.div>

      {/* Enhanced No Client Selected Message */}
      {!hasValidSelection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="flex-1 flex items-center justify-center min-h-[200px]"
        >
          <Card className={`${elevatedSurface} w-full p-8`}>
            <CardContent className="p-0">
              <div className="flex items-center gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-16 h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center ring-1 ring-blue-500/20"
                >
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {isComparisonMode ? 'Select Two Clients to Compare' : 'Select a Client to View Visualizations'}
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {isComparisonMode
                      ? 'Choose two different clients to compare their financial metrics, asset allocation, and income/expense breakdown side-by-side.'
                      : 'Choose a client from the selector above to view their financial visualizations including Wisdom Index ratios, asset allocation, income analysis, and expense breakdown.'}
                  </p>

                  <div className="flex gap-3 flex-wrap">
                    {chartConfigs.slice(0, 4).map((config, index) => (
                      <motion.div
                        key={config.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50/80 border border-slate-200/60"
                      >
                        <div className={`p-1.5 rounded-lg ${config.iconAccent}`}>
                          <config.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 whitespace-nowrap">{config.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enhanced Main Dashboard Grid */}
      {hasValidSelection && activeClientId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Charts Grid */}
          <div className={`${isComparisonMode ? 'space-y-6' : gridConfig.className} ${spacing.gap}`}>
            
            {/* In comparison mode, stack charts vertically with enhanced containers */}
            {isComparisonMode ? (
              <>
                {chartConfigs.map((config, index) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className={`${elevatedSurface} p-6`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${config.iconAccent}`}>
                        <config.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{config.title}</h3>
                        <p className="text-sm text-slate-600">{config.subtitle}</p>
                      </div>
                      {isComparisonMode && comparisonClientId && (
                        <div className="ml-auto flex items-center gap-2 text-sm text-blue-600 font-medium">
                          <Target className="h-4 w-4" />
                          <span>Comparison Mode</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`${config.id === 'asset-allocation' ? 'h-[400px]' : 'h-[300px]'}`}>
                      {config.id === 'wisdom-index' && (
                        <WisdomIndexBarChart
                          key={`wisdom-index-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={false}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      )}
                      {config.id === 'asset-allocation' && (
                        <TreemapChart
                          key={`asset-allocation-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={false}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      )}
                      {config.id === 'income-analysis' && (
                        <SimpleIncomeBarChart
                          key={`income-analysis-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={false}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      )}
                      {config.id === 'expense-breakdown' && (
                        <SimpleExpensePieChart
                          key={`expense-breakdown-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={false}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              // Enhanced layout for single client mode
              <>
                {/* Financial Ratios - Top Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className={`${gridLayout === 'ultra-compact' ? 'col-span-1 row-span-1' : 'col-span-4 row-span-1'}`}
                >
                  <div className="h-[300px]">
                    <WisdomIndexBarChart
                      key={`wisdom-index-${activeClientId}-${comparisonClientId}`}
                      authToken={authToken}
                      compact={gridLayout === 'ultra-compact' ? true : isCompactMode}
                      clientId={activeClientId}
                      comparisonClientId={comparisonClientId}
                    />
                  </div>
                </motion.div>

                {/* Standard/Compact layout: Match client-side layout */}
                {gridLayout !== 'ultra-compact' && (
                  <>
                    {/* Asset Allocation Treemap - Bottom Left (50% Width) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="col-span-2 row-span-1"
                    >
                      <div className="h-[300px]">
                        <TreemapChart
                          key={`asset-allocation-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={isCompactMode}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>

                    {/* Income Analysis - Bottom Middle (25% Width) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="col-span-1 row-span-1"
                    >
                      <div className="h-[300px]">
                        <SimpleIncomeBarChart
                          key={`income-analysis-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={isCompactMode}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>

                    {/* Expense Analysis - Bottom Right (25% Width) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="col-span-1 row-span-1"
                    >
                      <div className="h-[300px]">
                        <SimpleExpensePieChart
                          key={`expense-breakdown-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={isCompactMode}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>
                  </>
                )}

                {/* Ultra-compact layout: 2x2 grid */}
                {gridLayout === 'ultra-compact' && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="col-span-1 row-span-1"
                    >
                      <div className="h-[300px]">
                        <TreemapChart
                          key={`asset-allocation-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={true}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="col-span-1 row-span-1"
                    >
                      <div className="h-[300px]">
                        <SimpleIncomeBarChart
                          key={`income-analysis-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={true}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="col-span-1 row-span-1"
                    >
                      <div className="h-[300px]">
                        <SimpleExpensePieChart
                          key={`expense-breakdown-${activeClientId}-${comparisonClientId}`}
                          authToken={authToken}
                          compact={true}
                          clientId={activeClientId}
                          comparisonClientId={comparisonClientId}
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};