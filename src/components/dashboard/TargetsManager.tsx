import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, Target, TrendingUp, TrendingDown, DollarSign, Percent, Shield, PiggyBank, Home, Briefcase, Heart, PieChart, RotateCcw } from 'lucide-react';
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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get category-specific icons and colors - matching client side blue theme
  const getCategoryStyle = (categoryTitle: string) => {
    // Simplify matching by checking inclusion since titles might vary slightly
    const title = categoryTitle || '';
    
    if (title.includes('Assets') || title.includes('Liabilities')) {
        return {
          icon: <DollarSign className="w-4 h-4" />,
          bgGradient: 'from-blue-50/80 to-blue-100/40',
          borderColor: 'border-blue-950',
          headerBg: 'bg-gradient-to-r from-blue-950 to-blue-900',
          titleColor: 'text-blue-950',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    } else if (title.includes('Income')) {
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgGradient: 'from-blue-50/70 to-blue-100/30',
          borderColor: 'border-blue-900',
          headerBg: 'bg-gradient-to-r from-blue-900 to-blue-800',
          titleColor: 'text-blue-900',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    } else if (title.includes('Expense')) {
        return {
          icon: <PiggyBank className="w-4 h-4" />,
          bgGradient: 'from-blue-50/60 to-blue-100/20',
          borderColor: 'border-blue-800',
          headerBg: 'bg-gradient-to-r from-blue-800 to-blue-700',
          titleColor: 'text-blue-800',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    } else if (title.includes('Insurance')) {
        return {
          icon: <Shield className="w-4 h-4" />,
          bgGradient: 'from-blue-50/50 to-blue-100/10',
          borderColor: 'border-blue-700',
          headerBg: 'bg-gradient-to-r from-blue-700 to-blue-600',
          titleColor: 'text-blue-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    } else if (title.includes('Future Planning') || title.includes('Ratios')) {
        // Distinguish between Future Planning and Wisdom Index if possible, but using general blue for now
        // If "Wisdom" is in the title
        if (title.includes('Wisdom')) {
             return {
                icon: <PieChart className="w-4 h-4" />,
                bgGradient: 'from-blue-50/30 to-slate-50/10',
                borderColor: 'border-blue-500',
                headerBg: 'bg-gradient-to-r from-blue-500 to-blue-400',
                titleColor: 'text-blue-500',
                cardBg: 'bg-white/80 backdrop-blur-sm'
              };
        }
        return {
          icon: <Target className="w-4 h-4" />,
          bgGradient: 'from-blue-50/40 to-slate-50/20',
          borderColor: 'border-blue-600',
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-500',
          titleColor: 'text-blue-600',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    }
    
    return {
      icon: <Target className="w-4 h-4" />,
      bgGradient: 'from-gray-50/60 to-gray-100/20',
      borderColor: 'border-gray-500',
      headerBg: 'bg-gradient-to-r from-gray-500 to-gray-400',
      titleColor: 'text-gray-700',
      cardBg: 'bg-white/80 backdrop-blur-sm'
    };
  };

  // Get metric-specific icons
  const getMetricIcon = (metricName: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      'net-worth': <DollarSign className="w-3 h-3" />,
      'portfolio-value': <Briefcase className="w-3 h-3" />,
      'real-estate-value': <Home className="w-3 h-3" />,
      'debt': <TrendingDown className="w-3 h-3" />,
      'equity': <TrendingUp className="w-3 h-3" />,
      'fixed-income': <DollarSign className="w-3 h-3" />,
      'cash': <DollarSign className="w-3 h-3" />,
      'earned-income': <Briefcase className="w-3 h-3" />,
      'social-security-income': <Heart className="w-3 h-3" />,
      'pension-income': <Heart className="w-3 h-3" />,
      'real-estate-income': <Home className="w-3 h-3" />,
      'business-income': <Briefcase className="w-3 h-3" />,
      'total-income': <TrendingUp className="w-3 h-3" />,
      'current-year-giving': <Heart className="w-3 h-3" />,
      'current-year-savings': <PiggyBank className="w-3 h-3" />,
      'current-year-debt': <TrendingDown className="w-3 h-3" />,
      'current-year-taxes': <DollarSign className="w-3 h-3" />,
      'current-year-living-expenses': <Home className="w-3 h-3" />,
      'total-expenses': <TrendingDown className="w-3 h-3" />,
      'margin': <Percent className="w-3 h-3" />,
      'life-insurance': <Shield className="w-3 h-3" />,
      'disability': <Shield className="w-3 h-3" />,
      'ltc': <Shield className="w-3 h-3" />,
      'umbrella': <Shield className="w-3 h-3" />,
      'business-insurance': <Shield className="w-3 h-3" />,
      'flood-insurance': <Shield className="w-3 h-3" />,
      'at-risk': <TrendingDown className="w-3 h-3" />,
      'retirement-ratio': <Target className="w-3 h-3" />,
      'survivor-ratio': <Target className="w-3 h-3" />,
      'education-ratio': <Target className="w-3 h-3" />,
      'new-cars-ratio': <Target className="w-3 h-3" />,
      'ltc-ratio': <Target className="w-3 h-3" />,
      'ltd-ratio': <Target className="w-3 h-3" />,
      'savings-ratio': <PiggyBank className="w-3 h-3" />,
      'giving-ratio': <Heart className="w-3 h-3" />,
      'reserves-ratio': <Shield className="w-3 h-3" />,
      'debt-ratio': <TrendingDown className="w-3 h-3" />,
      'diversification-ratio': <PieChart className="w-3 h-3" />
    };
    
    return iconMap[metricName] || <Target className="w-3 h-3" />;
  };

  const getTargetStatus = (metricName: string) => {
    const currentValue = metricsData[metricName]?.value;
    const targetValue = targetsData[metricName];
    
    if (!targetValue || currentValue === undefined || currentValue === null) {
      return { status: 'no-target', displayText: 'No Target', variant: 'outline' as const, customClass: '' };
    }
    
    // Calculate percentage difference
    const percentage = ((currentValue / targetValue - 1) * 100);
    
    if (currentValue > targetValue) {
      // Above target is GOOD - show green
      return {
        status: 'above',
        displayText: `↑ ${Math.abs(percentage).toFixed(1)}%`,
        variant: 'outline' as const,
        customClass: 'bg-green-50 text-green-700 border-green-200',
        progressPercentage: Math.min((currentValue / targetValue) * 100, 100)
      };
    }
    if (currentValue < targetValue) {
      // Below target is BAD - show red
      return {
        status: 'below',
        displayText: `↓ ${Math.abs(percentage).toFixed(1)}%`,
        variant: 'outline' as const,
        customClass: 'bg-red-50 text-red-700 border-red-200',
        progressPercentage: Math.min((currentValue / targetValue) * 100, 100)
      };
    }
    return {
      status: 'equal',
      displayText: '✓ On Target',
      variant: 'outline' as const,
      customClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      progressPercentage: 100
    };
  };

  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Header Section - Matching Admin Side Style */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 opacity-60 pointer-events-none"></div>
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-900 to-blue-800 text-white shadow-lg">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Target Management</h3>
                <p className="text-gray-600 text-sm">Set and track your financial goals</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Save Message Badge equivalent - showing success status */}
              {(saveTargetsSuccess || resetTargetsSuccess) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    className={`px-3 py-2 text-sm font-medium shadow-md ${
                        'bg-green-100 text-green-800 border-green-200'
                    }`}
                  >
                    {saveTargetsSuccess ? 'Targets saved successfully!' : 'Targets reset successfully!'}
                  </Badge>
                </motion.div>
              )}

              <Button
                onClick={discardChanges}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200/80 hover:bg-white hover:text-gray-900 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revert
              </Button>
              
              <Button
                onClick={handleResetAllTargets}
                disabled={resetTargetsLoading || resetTargetsSuccess}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              
              <Button
                onClick={saveTargets}
                disabled={saveTargetsLoading || saveTargetsSuccess}
                size="sm"
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveTargetsLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-blue-400 animate-spin opacity-30"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading targets...</p>
            <p className="text-gray-400 text-sm mt-1">Preparing target management interface</p>
          </div>
      )}

      {/* Error State */}
      {!loading && error && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100/50 shadow-lg backdrop-blur-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-lg">
                <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Failed to load targets</h3>
            <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                We encountered an issue while retrieving your financial targets. Please check your connection and try again.
            </p>
            <Button
                onClick={loadTargetsData}
                className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg hover:shadow-xl"
            >
                Retry Loading
            </Button>
          </div>
      )}

      {!loading && !error && (
        <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                staggerChildren: 0.1
                }
            }
            }}
        >
            {Object.entries(metricsByCategory).map(([categoryTitle, categoryMetrics]) => {
            const categoryStyle = getCategoryStyle(categoryTitle);
            
            return (
                <motion.div
                key={categoryTitle}
                variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                <Card
                    className={`overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                    {/* Enhanced Category Header */}
                    <div className={`${categoryStyle.headerBg} p-4 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white">
                        {categoryStyle.icon}
                        </div>
                        <h4 className="text-lg font-bold text-white">{categoryTitle}</h4>
                        <div className="ml-auto">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                            {categoryMetrics.length} metrics
                        </div>
                        </div>
                    </div>
                    </div>
                    
                    {/* Enhanced Category Content */}
                    <div className={`p-6 ${categoryStyle.bgGradient}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryMetrics.map((metric) => {
                        const currentValue = metricsData[metric.name]?.value;
                        const targetValue = targetsData[metric.name];
                        const targetStatus = getTargetStatus(metric.name);
                        
                        return (
                            <motion.div
                            key={metric.name}
                            className={`group relative p-5 rounded-xl border ${categoryStyle.borderColor} ${categoryStyle.cardBg} shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                            {/* Metric Header with Icon - Clean design without border */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`p-1.5 rounded-lg bg-gray-50 ${categoryStyle.titleColor}`}>
                                {getMetricIcon(metric.name)}
                                </div>
                                <Label
                                htmlFor={`target-${metric.name}`}
                                className={`text-sm font-bold ${categoryStyle.titleColor}`}
                                >
                                {metric.title}
                                </Label>
                            </div>
                            
                            {/* Enhanced Input and Status */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                    id={`target-${metric.name}`}
                                    type="number"
                                    value={targetValue || ''}
                                    onChange={(e) => updateTargetValue(metric.name, e.target.value)}
                                    placeholder="Set target"
                                    step={metric.isRatio ? "0.01" : "1"}
                                    min="0"
                                    className={`border-gray-200 focus:border-blue-400 focus:ring-blue-100 pr-10 transition-all duration-200 text-sm h-10 ${
                                        targetValue ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                    />
                                    {targetValue && (
                                    <button
                                        onClick={() => deleteIndividualTarget(metric.name)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                        title="Delete target"
                                        type="button"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    )}
                                </div>
                                {metric.isRatio ? (
                                    <Percent className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                )}
                                </div>
                                
                                {/* Enhanced Progress Bar */}
                                {targetValue && currentValue !== undefined && currentValue !== null && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-600">
                                    <span>Progress</span>
                                    <span>{targetStatus.progressPercentage?.toFixed(0) || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                                    <motion.div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                        targetStatus.status === 'above' ? 'bg-green-500' :
                                        targetStatus.status === 'below' ? 'bg-red-500' :
                                        'bg-yellow-500'
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${targetStatus.progressPercentage || 0}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                    </div>
                                </div>
                                )}
                                
                                {/* Enhanced Status Badge */}
                                <div className="flex items-center justify-between">
                                <Badge
                                    variant={targetStatus.variant}
                                    className={`min-w-[90px] justify-center font-semibold text-sm shadow-md transition-all duration-200 ${
                                    targetStatus.customClass || 'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                >
                                    {targetStatus.status === 'above' && <TrendingUp className="w-3 h-3 mr-1.5" />}
                                    {targetStatus.status === 'below' && <TrendingDown className="w-3 h-3 mr-1.5" />}
                                    {targetStatus.status === 'equal' && <Target className="w-3 h-3 mr-1.5" />}
                                    {targetStatus.displayText}
                                </Badge>
                                </div>
                                
                                {/* Enhanced Current Value Display */}
                                <div className={`text-sm p-3 rounded-lg bg-gray-50 ${categoryStyle.titleColor} font-semibold border border-gray-100`}>
                                <span className="text-gray-500">Current Value: </span>
                                {metric.isRatio ? currentValue?.toFixed(2) + '%' : formatCurrency(currentValue || 0)}
                                </div>
                            </div>
                            
                            {/* Subtle decorative element */}
                            <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-20"></div>
                            </motion.div>
                        );
                        })}
                    </div>
                    </div>
                </Card>
                </motion.div>
            );
            })}
        </motion.div>
      )}

      {/* Enhanced Reset Confirmation Modal */}
      <ConfirmDialog
        isOpen={showResetConfirmation}
        onClose={handleCloseResetConfirmation}
        onConfirm={confirmResetTargets}
        title="Confirm Reset"
        description="Are you sure you want to reset all targets? This action cannot be undone and all your custom goals will be permanently lost."
        confirmText="Yes, Reset Everything"
        cancelText="Cancel"
      />
    </div>
  );
};