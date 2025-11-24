'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { TreemapChart } from './TreemapChart';
import { WisdomIndexBarChart } from './WisdomIndexBarChart';
import { SimpleIncomeBarChart } from './SimpleIncomeBarChart';
import { SimpleExpensePieChart } from './SimpleExpensePieChart';

interface VisualizationsViewProps {
  authToken: string | null;
}

export const VisualizationsView: React.FC<VisualizationsViewProps> = ({
  authToken
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [gridLayout, setGridLayout] = useState<'standard' | 'compact' | 'ultra-compact'>('standard');

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

  React.useEffect(() => {
    console.log('[VisualizationsView] Component mounted, authToken:', authToken ? 'exists' : 'missing');
    console.log('[VisualizationsView] Viewport height:', viewportHeight, 'Layout mode:', gridLayout);
  }, [authToken, viewportHeight, gridLayout]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        height: 'calc(100vh - 120px)', // Account for header and other UI elements
        maxHeight: 'calc(100vh - 120px)',
        willChange: 'auto' // Optimize for animations
      }}
    >
      {/* Main Dashboard Grid - Responsive to viewport height */}
      <div className={`flex-1 ${gridConfig.className} ${spacing.gap} min-h-0 overflow-hidden`}>
        
        {/* Financial Ratios - Top Row (Full Width in standard, 2x2 in compact) */}
        {gridLayout === 'ultra-compact' ? (
          // Ultra-compact: Split into 2x2 grid
          <>
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <WisdomIndexBarChart authToken={authToken} compact={true} />
              </div>
            </div>
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <TreemapChart authToken={authToken} compact={true} />
              </div>
            </div>
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <SimpleIncomeBarChart authToken={authToken} compact={true} />
              </div>
            </div>
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <SimpleExpensePieChart authToken={authToken} compact={true} />
              </div>
            </div>
          </>
        ) : (
          // Standard/Compact: Original layout
          <>
            <div className="col-span-4 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <WisdomIndexBarChart authToken={authToken} compact={isCompactMode} />
              </div>
            </div>

            {/* Asset Allocation Treemap - Bottom Left (50% Width) */}
            <div className="col-span-2 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <TreemapChart authToken={authToken} compact={isCompactMode} />
              </div>
            </div>

            {/* Income Analysis - Bottom Middle (25% Width) */}
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <SimpleIncomeBarChart authToken={authToken} compact={isCompactMode} />
              </div>
            </div>

            {/* Expense Analysis - Bottom Right (25% Width) */}
            <div className="col-span-1 row-span-1 h-full min-h-0">
              <div className="h-full min-h-0">
                <SimpleExpensePieChart authToken={authToken} compact={isCompactMode} />
              </div>
            </div>
          </>
        )}
      </div>

    </motion.div>
  );
};