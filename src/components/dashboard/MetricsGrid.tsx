'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { MetricCard } from './MetricCard';
import metrics from './MetricCard';

interface MetricsGridProps {
  metricsData: Record<string, any>;
  loading: boolean;
  metricsLoaded: boolean;
  targetsLoaded: boolean;
  handleMetricCardClick: (metricName: string, category: string) => void;
  isInitialLoad: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metricsData,
  loading,
  metricsLoaded,
  targetsLoaded,
  handleMetricCardClick,
  isInitialLoad
}) => {
  // Gives the grid a soft pulse each time metrics are reloaded.
  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.97,
      filter: 'blur(10px)'
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.45,
        ease: 'easeOut',
        when: 'beforeChildren',
        delayChildren: 0.08,
        staggerChildren: 0.02
      }
    }
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 24,
      scale: 0.9,
      rotateX: -12,
      transformPerspective: 600
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transformPerspective: 600,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 24,
        mass: 0.9
      }
    }
  };

  const showLoadedAnimation = metricsLoaded && !loading;

  return (
    <motion.div
      key={showLoadedAnimation ? 'metrics-loaded' : 'metrics-loading'}
      className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2 w-full h-full overflow-hidden auto-rows-fr ${isInitialLoad ? '' : ''}`}
      id="metrics-grid"
      variants={containerVariants}
      initial={showLoadedAnimation ? 'hidden' : false}
      animate="visible"
    >
      {metrics.map((metric: any, index: number) => (
        <motion.div key={metric?.name || `empty-${index}`} variants={cardVariants}>
          <MetricCard
            metric={metric}
            index={index}
            metricsData={metricsData}
            loading={loading}
            metricsLoaded={metricsLoaded}
            targetsLoaded={targetsLoaded}
            handleMetricCardClick={handleMetricCardClick}
            isInitialLoad={isInitialLoad}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
