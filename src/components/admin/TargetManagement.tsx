'use client';

import { useState, useEffect } from 'react';
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
        customClass: 'bg-green-50 text-green-700 border-green-200'
      };
    }
    if (currentValue < targetValue) {
      // Below target is BAD - show red
      return {
        status: 'below',
        displayText: `↓ ${Math.abs(percentage).toFixed(1)}%`,
        variant: 'outline' as const,
        customClass: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    return {
      status: 'equal',
      displayText: '✓ On Target',
      variant: 'outline' as const,
      customClass: 'bg-blue-50 text-blue-700 border-blue-200'
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
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  // Get category-specific icons and colors
  const getCategoryStyle = (categoryTitle: string) => {
    switch (categoryTitle) {
      case 'Assets & Liabilities':
        return {
          icon: <DollarSign className="w-4 h-4" />,
          bgGradient: 'from-emerald-50 to-teal-50',
          borderColor: 'border-emerald-200',
          headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          titleColor: 'text-emerald-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Income Analysis':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgGradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          titleColor: 'text-blue-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Expense Tracking':
        return {
          icon: <PiggyBank className="w-4 h-4" />,
          bgGradient: 'from-orange-50 to-amber-50',
          borderColor: 'border-orange-200',
          headerBg: 'bg-gradient-to-r from-orange-500 to-amber-600',
          titleColor: 'text-orange-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Insurance Coverage':
        return {
          icon: <Shield className="w-4 h-4" />,
          bgGradient: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200',
          headerBg: 'bg-gradient-to-r from-purple-500 to-pink-600',
          titleColor: 'text-purple-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Future Planning Ratios':
        return {
          icon: <Target className="w-4 h-4" />,
          bgGradient: 'from-cyan-50 to-sky-50',
          borderColor: 'border-cyan-200',
          headerBg: 'bg-gradient-to-r from-cyan-500 to-sky-600',
          titleColor: 'text-cyan-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      case 'Wisdom Index Ratios':
        return {
          icon: <PieChart className="w-4 h-4" />,
          bgGradient: 'from-fuchsia-50 to-indigo-50',
          borderColor: 'border-fuchsia-200',
          headerBg: 'bg-gradient-to-r from-fuchsia-500 to-indigo-600',
          titleColor: 'text-fuchsia-700',
          cardBg: 'bg-white/80 backdrop-blur-sm'
        };
      default:
        return {
          icon: <Target className="w-4 h-4" />,
          bgGradient: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          headerBg: 'bg-gradient-to-r from-gray-500 to-slate-600',
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
    <div className="space-y-4 p-3">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 shadow-lg border border-blue-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10"></div>
        <div className="relative p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Target Management</h3>
                <p className="text-gray-600 text-xs">Client {clientId}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {saveMessage && (
                <Badge
                  variant={saveMessage.includes('success') ? 'default' : 'destructive'}
                  className={`px-2 py-1 text-xs font-medium shadow-sm ${
                    saveMessage.includes('success')
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {saveMessage}
                </Badge>
              )}
              <Button
                onClick={resetAllTargets}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button
                onClick={saveTargets}
                disabled={isSaving}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 shadow"
              >
                <Save className="w-3 h-3 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metricCategories.map((category) => {
          const categoryStyle = getCategoryStyle(category.title);
          
          return (
            <Card
              key={category.title}
              className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5`}
            >
              {/* Enhanced Category Header */}
              <div className={`${categoryStyle.headerBg} p-3 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white">
                    {categoryStyle.icon}
                  </div>
                  <h4 className="text-base font-bold text-white">{category.title}</h4>
                  <div className="ml-auto">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs font-medium">
                      {category.metrics.length}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Category Content */}
              <div className={`p-3 ${categoryStyle.bgGradient}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.metrics.map((metric) => {
                    const currentValue = getCurrentValue(metric.name);
                    const targetValue = targets[metric.name];
                    const targetStatus = getTargetStatus(metric.name);
                    
                    return (
                      <div
                        key={metric.name}
                        className={`group relative p-3 rounded-lg border ${categoryStyle.borderColor} ${categoryStyle.cardBg} shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5`}
                      >
                        {/* Metric Header with Icon */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={`p-1 rounded-lg ${categoryStyle.titleColor} bg-opacity-10 ${categoryStyle.titleColor.replace('text', 'bg')}`}>
                            {getMetricIcon(metric.name)}
                          </div>
                          <Label
                            htmlFor={`target-${metric.name}`}
                            className={`text-xs font-semibold ${categoryStyle.titleColor}`}
                          >
                            {metric.title}
                          </Label>
                        </div>
                         
                        {/* Enhanced Input and Status */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <Input
                                id={`target-${metric.name}`}
                                type="number"
                                value={targetValue || ''}
                                onChange={(e) => handleTargetChange(metric.name, e.target.value)}
                                placeholder="Target"
                                step="0.01"
                                min="0"
                                className={`border-gray-200 focus:border-blue-400 focus:ring-blue-100 pr-8 transition-all duration-200 text-xs h-8 ${
                                  targetValue ? 'bg-white' : 'bg-gray-50'
                                }`}
                              />
                              {targetValue && (
                                <button
                                  onClick={() => deleteTarget(metric.name)}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                  title="Delete target"
                                  type="button"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                           
                          {/* Enhanced Status Badge */}
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={targetStatus.variant}
                              className={`min-w-[80px] justify-center font-medium text-xs shadow-sm transition-all duration-200 ${
                                targetStatus.customClass || 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {targetStatus.status === 'above' && <TrendingUp className="w-2.5 h-2.5 mr-1" />}
                              {targetStatus.status === 'below' && <TrendingDown className="w-2.5 h-2.5 mr-1" />}
                              {targetStatus.status === 'equal' && <Target className="w-2.5 h-2.5 mr-1" />}
                              {targetStatus.displayText}
                            </Badge>
                            
                            {metric.isRatio ? (
                              <Percent className="w-3 h-3 text-gray-400" />
                            ) : (
                              <DollarSign className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                           
                          {/* Enhanced Current Value Display */}
                          <div className={`text-xs p-1.5 rounded bg-gray-50 ${categoryStyle.titleColor} font-medium`}>
                            <span className="text-gray-500">Current: </span>
                            {metric.isRatio ? currentValue?.toFixed(2) : formatCurrency(currentValue || 0)}
                          </div>
                        </div>
                         
                        {/* Subtle decorative element */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-30"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Delete Target Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({ isOpen: false })}
        onConfirm={deleteConfirmDialog.onConfirm || (() => {})}
        title="Delete Target"
        description={`Are you sure you want to delete the target for ${deleteConfirmDialog.metricName}?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      {/* Reset All Targets Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmDialog.isOpen}
        onClose={() => setResetConfirmDialog({ isOpen: false })}
        onConfirm={resetConfirmDialog.onConfirm || (() => {})}
        title="Reset All Targets"
        description="Are you sure you want to reset ALL targets for this client? This action cannot be undone."
        confirmText="Reset All"
        cancelText="Cancel"
      />
    </div>
  );
}
