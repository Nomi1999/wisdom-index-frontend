'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, Target, TrendingUp, TrendingDown, DollarSign, Percent, Shield, PiggyBank, Home, Briefcase, Heart, PieChart } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface TargetManagementProps {
  clientId: number;
}

interface Targets {
  [key: string]: number | null;
}

export function TargetManagement({ clientId }: TargetManagementProps) {
  const [targets, setTargets] = useState<Targets>({});
  const [currentMetrics, setCurrentMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    metricName?: string;
    onConfirm?: () => void;
  }>({ isOpen: false });
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false });

  useEffect(() => {
    loadTargetsAndMetrics();
  }, [clientId]);

  const loadTargetsOnly = async () => {
    try {
      const token = getAuthToken();
      
      // Load current targets for the specific client (admin endpoint)
      const targetsResponse = await fetch(buildApiUrl(`/api/admin/client/${clientId}/targets`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        setTargets(targetsData.targets || {});
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const loadTargetsAndMetrics = async () => {
    try {
      const token = getAuthToken();
      
      // Load current targets for the specific client (admin endpoint)
      const targetsResponse = await fetch(buildApiUrl(`/api/admin/client/${clientId}/targets`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Load current metrics for comparison
      const metricsResponse = await fetch(buildApiUrl(`/api/admin/client/${clientId}/metrics`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (targetsResponse.ok && metricsResponse.ok) {
        const targetsData = await targetsResponse.json();
        const metricsData = await metricsResponse.json();
        
        setTargets(targetsData.targets || {});
        setCurrentMetrics(metricsData.metrics);
      }
    } catch (error) {
      console.error('Error loading targets and metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetChange = (metricName: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setTargets(prev => ({
      ...prev,
      [metricName]: numValue
    }));
  };

  const saveTargets = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl(`/api/admin/client/${clientId}/targets`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: targets
        }),
      });

      if (response.ok) {
        // Reload only targets from server for faster response
        await loadTargetsOnly();
        setSaveMessage('Targets saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving targets');
      }
    } catch (error) {
      console.error('Error saving targets:', error);
      setSaveMessage('Error saving targets');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTargetStatus = (metricName: string) => {
    const currentValue = getCurrentValue(metricName);
    const targetValue = targets[metricName];
    
    if (!targetValue || !currentValue) {
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

  const deleteTarget = async (metricName: string) => {
    // Open custom confirmation dialog
    setDeleteConfirmDialog({
      isOpen: true,
      metricName,
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const response = await fetch(buildApiUrl(`/api/admin/client/${clientId}/targets/${metricName}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Reload only targets from server for faster response
            await loadTargetsOnly();
            setSaveMessage('Target deleted successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
          } else {
            setSaveMessage('Error deleting target');
          }
        } catch (error) {
          console.error('Error deleting target:', error);
          setSaveMessage('Error deleting target');
        }
      }
    });
  };

  const resetAllTargets = async () => {
    // Open custom confirmation dialog
    setResetConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        try {
          const token = getAuthToken();
          const response = await fetch(buildApiUrl(`/api/admin/client/${clientId}/targets`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Reload only targets from server for faster response
            await loadTargetsOnly();
            setSaveMessage('All targets reset successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
          } else {
            setSaveMessage('Error resetting targets');
          }
        } catch (error) {
          console.error('Error resetting targets:', error);
          setSaveMessage('Error resetting targets');
        }
      }
    });
  };

  const getCurrentValue = (metricName: string): number => {
    // Navigate through the metrics structure to find the current value
    const metricPath = getMetricPath(metricName);
    let value = currentMetrics;
    
    for (const key of metricPath) {
      value = value?.[key];
    }
    
    return value || 0;
  };

  const getMetricPath = (metricName: string): string[] => {
    const pathMap: { [key: string]: string[] } = {
      'net-worth': ['assets_and_liabilities', 'net_worth'],
      'portfolio-value': ['assets_and_liabilities', 'portfolio_value'],
      'real-estate-value': ['assets_and_liabilities', 'real_estate_value'],
      'debt': ['assets_and_liabilities', 'debt'],
      'equity': ['assets_and_liabilities', 'equity'],
      'fixed-income': ['assets_and_liabilities', 'fixed_income'],
      'cash': ['assets_and_liabilities', 'cash'],
      'earned-income': ['income_analysis', 'earned_income'],
      'social-security-income': ['income_analysis', 'social_security_income'],
      'pension-income': ['income_analysis', 'pension_income'],
      'real-estate-income': ['income_analysis', 'real_estate_income'],
      'business-income': ['income_analysis', 'business_income'],
      'total-income': ['income_analysis', 'total_income'],
      'current-year-giving': ['expense_tracking', 'current_year_giving'],
      'current-year-savings': ['expense_tracking', 'current_year_savings'],
      'current-year-debt': ['expense_tracking', 'current_year_debt'],
      'current-year-taxes': ['expense_tracking', 'current_year_taxes'],
      'current-year-living-expenses': ['expense_tracking', 'current_year_living_expenses'],
      'total-expenses': ['expense_tracking', 'total_expenses'],
      'margin': ['expense_tracking', 'margin'],
      'life-insurance': ['insurance_coverage', 'life_insurance'],
      'disability': ['insurance_coverage', 'disability'],
      'ltc': ['insurance_coverage', 'ltc'],
      'umbrella': ['insurance_coverage', 'umbrella'],
      'business-insurance': ['insurance_coverage', 'business_insurance'],
      'flood-insurance': ['insurance_coverage', 'flood_insurance'],
      'at-risk': ['insurance_coverage', 'at_risk'],
      'retirement-ratio': ['future_planning_ratios', 'retirement_ratio'],
      'survivor-ratio': ['future_planning_ratios', 'survivor_ratio'],
      'education-ratio': ['future_planning_ratios', 'education_ratio'],
      'new-cars-ratio': ['future_planning_ratios', 'new_cars_ratio'],
      'ltc-ratio': ['future_planning_ratios', 'ltc_ratio'],
      'ltd-ratio': ['future_planning_ratios', 'ltd_ratio'],
      'savings-ratio': ['wisdom_index_ratios', 'savings_ratio'],
      'giving-ratio': ['wisdom_index_ratios', 'giving_ratio'],
      'reserves-ratio': ['wisdom_index_ratios', 'reserves_ratio'],
      'debt-ratio': ['wisdom_index_ratios', 'debt_ratio'],
      'diversification-ratio': ['wisdom_index_ratios', 'diversification_ratio']
    };
    
    return pathMap[metricName] || [];
  };

  const metricCategories = [
    {
      title: 'Assets & Liabilities',
      metrics: [
        { name: 'net-worth', title: 'Net Worth', isRatio: false },
        { name: 'portfolio-value', title: 'Portfolio Value', isRatio: false },
        { name: 'real-estate-value', title: 'Real Estate Value', isRatio: false },
        { name: 'debt', title: 'Debt', isRatio: false },
        { name: 'equity', title: 'Equity', isRatio: false },
        { name: 'fixed-income', title: 'Fixed Income', isRatio: false },
        { name: 'cash', title: 'Cash', isRatio: false },
      ]
    },
    {
      title: 'Income Analysis',
      metrics: [
        { name: 'earned-income', title: 'Earned Income', isRatio: false },
        { name: 'social-security-income', title: 'Social Security Income', isRatio: false },
        { name: 'pension-income', title: 'Pension Income', isRatio: false },
        { name: 'real-estate-income', title: 'Real Estate Income', isRatio: false },
        { name: 'business-income', title: 'Business Income', isRatio: false },
        { name: 'total-income', title: 'Total Income', isRatio: false },
      ]
    },
    {
      title: 'Expense Tracking',
      metrics: [
        { name: 'current-year-giving', title: 'Current Year Giving', isRatio: false },
        { name: 'current-year-savings', title: 'Current Year Savings', isRatio: false },
        { name: 'current-year-debt', title: 'Current Year Debt', isRatio: false },
        { name: 'current-year-taxes', title: 'Current Year Taxes', isRatio: false },
        { name: 'current-year-living-expenses', title: 'Current Year Living Expenses', isRatio: false },
        { name: 'total-expenses', title: 'Total Expenses', isRatio: false },
        { name: 'margin', title: 'Margin', isRatio: false },
      ]
    },
    {
      title: 'Insurance Coverage',
      metrics: [
        { name: 'life-insurance', title: 'Life Insurance', isRatio: false },
        { name: 'disability', title: 'Disability', isRatio: false },
        { name: 'ltc', title: 'LTC', isRatio: false },
        { name: 'umbrella', title: 'Umbrella', isRatio: false },
        { name: 'business-insurance', title: 'Business Insurance', isRatio: false },
        { name: 'flood-insurance', title: 'Flood Insurance', isRatio: false },
        { name: 'at-risk', title: 'At Risk', isRatio: false },
      ]
    },
    {
      title: 'Future Planning Ratios',
      metrics: [
        { name: 'retirement-ratio', title: 'Retirement Ratio', isRatio: true },
        { name: 'survivor-ratio', title: 'Survivor Ratio', isRatio: true },
        { name: 'education-ratio', title: 'Education Ratio', isRatio: true },
        { name: 'new-cars-ratio', title: 'New Cars Ratio', isRatio: true },
        { name: 'ltc-ratio', title: 'LTC Ratio', isRatio: true },
        { name: 'ltd-ratio', title: 'LTD Ratio', isRatio: true },
      ]
    },
    {
      title: 'Wisdom Index Ratios',
      metrics: [
        { name: 'savings-ratio', title: 'Savings Ratio', isRatio: true },
        { name: 'giving-ratio', title: 'Giving Ratio', isRatio: true },
        { name: 'reserves-ratio', title: 'Reserves Ratio', isRatio: true },
        { name: 'debt-ratio', title: 'Debt Ratio', isRatio: true },
        { name: 'diversification-ratio', title: 'Diversification Ratio', isRatio: true }
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-blue-400 animate-spin opacity-30"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading client targets...</p>
        <p className="text-gray-400 text-sm mt-1">Preparing target management interface</p>
      </div>
    );
  }

  // Get category-specific icons and colors - matching client side blue theme
  const getCategoryStyle = (categoryTitle: string) => {
    switch (categoryTitle) {
      case 'Assets & Liabilities':
        return {
          icon: <DollarSign className="w-4 h-4" />,
          bgGradient: 'from-blue-50/80 to-blue-100/40',
          borderColor: 'border-blue-950',
          headerBg: 'bg-gradient-to-r from-blue-950 to-blue-900',
          titleColor: 'text-blue-950',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Income Analysis':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgGradient: 'from-blue-50/70 to-blue-100/30',
          borderColor: 'border-blue-900',
          headerBg: 'bg-gradient-to-r from-blue-900 to-blue-800',
          titleColor: 'text-blue-900',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Expense Tracking':
        return {
          icon: <PiggyBank className="w-4 h-4" />,
          bgGradient: 'from-blue-50/60 to-blue-100/20',
          borderColor: 'border-blue-800',
          headerBg: 'bg-gradient-to-r from-blue-800 to-blue-700',
          titleColor: 'text-blue-800',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Insurance Coverage':
        return {
          icon: <Shield className="w-4 h-4" />,
          bgGradient: 'from-blue-50/50 to-blue-100/10',
          borderColor: 'border-blue-700',
          headerBg: 'bg-gradient-to-r from-blue-700 to-blue-600',
          titleColor: 'text-blue-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Future Planning Ratios':
        return {
          icon: <Target className="w-4 h-4" />,
          bgGradient: 'from-blue-50/40 to-slate-50/20',
          borderColor: 'border-blue-600',
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-500',
          titleColor: 'text-blue-600',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Wisdom Index Ratios':
        return {
          icon: <PieChart className="w-4 h-4" />,
          bgGradient: 'from-blue-50/30 to-slate-50/10',
          borderColor: 'border-blue-500',
          headerBg: 'bg-gradient-to-r from-blue-500 to-blue-400',
          titleColor: 'text-blue-500',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      default:
        return {
          icon: <Target className="w-4 h-4" />,
          bgGradient: 'from-gray-50/60 to-gray-100/20',
          borderColor: 'border-gray-500',
          headerBg: 'bg-gradient-to-r from-gray-500 to-gray-400',
          titleColor: 'text-gray-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
    }
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

  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Header Section - Matching Client Side Style */}
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
                <p className="text-gray-600 text-sm">Client ID: {clientId}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    variant={saveMessage.includes('success') ? 'default' : 'destructive'}
                    className={`px-3 py-2 text-sm font-medium shadow-md ${
                      saveMessage.includes('success')
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {saveMessage}
                  </Badge>
                </motion.div>
              )}
              <Button
                onClick={resetAllTargets}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              <Button
                onClick={saveTargets}
                disabled={isSaving}
                size="sm"
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? (
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
        {metricCategories.map((category) => {
          const categoryStyle = getCategoryStyle(category.title);
           
          return (
            <motion.div
              key={category.title}
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
                    <h4 className="text-lg font-bold text-white">{category.title}</h4>
                    <div className="ml-auto">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                        {category.metrics.length} metrics
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Category Content */}
                <div className={`p-6 ${categoryStyle.bgGradient}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {category.metrics.map((metric) => {
                      const currentValue = getCurrentValue(metric.name);
                      const targetValue = targets[metric.name];
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
                                  onChange={(e) => handleTargetChange(metric.name, e.target.value)}
                                  placeholder="Set target"
                                  step="0.01"
                                  min="0"
                                  className={`border-gray-200 focus:border-blue-400 focus:ring-blue-100 pr-10 transition-all duration-200 text-sm h-10 ${
                                    targetValue ? 'bg-white' : 'bg-gray-50'
                                  }`}
                                />
                                {targetValue && (
                                  <button
                                    onClick={() => deleteTarget(metric.name)}
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
                            {targetValue && currentValue && (
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
                              {metric.isRatio ? currentValue?.toFixed(2) : formatCurrency(currentValue || 0)}
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
      
      {/* Enhanced Delete Target Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({ isOpen: false })}
        onConfirm={deleteConfirmDialog.onConfirm || (() => {})}
        title="Delete Target"
        description={`Are you sure you want to delete the target for ${deleteConfirmDialog.metricName}? This action cannot be undone.`}
        confirmText="Delete Target"
        cancelText="Cancel"
      />
      
      {/* Enhanced Reset All Targets Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmDialog.isOpen}
        onClose={() => setResetConfirmDialog({ isOpen: false })}
        onConfirm={resetConfirmDialog.onConfirm || (() => {})}
        title="Reset All Targets"
        description="Are you sure you want to reset ALL targets for this client? This will permanently remove all custom targets and cannot be undone."
        confirmText="Reset All Targets"
        cancelText="Cancel"
      />
    </div>
  );
}
