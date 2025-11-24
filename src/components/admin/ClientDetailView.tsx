'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TargetManagement } from './TargetManagement';
import { AdminAccountHistoryView } from './AccountHistoryView';
import { User, Mail, Shield, Clock, CheckCircle, AlertCircle, Calendar, Fingerprint, TrendingUp, DollarSign, PiggyBank, CreditCard, Home, Building, Briefcase, Heart, Umbrella, Target, Calculator, BarChart3, PieChart, Activity, Eye, TrendingDown, FileText, Settings, History } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  has_account: boolean;
  last_login?: string;
}

interface ClientMetrics {
  assets_and_liabilities: {
    net_worth: number;
    portfolio_value: number;
    real_estate_value: number;
    debt: number;
    equity: number;
    fixed_income: number;
    cash: number;
  };
  income_analysis: {
    earned_income: number;
    social_security_income: number;
    pension_income: number;
    real_estate_income: number;
    business_income: number;
    total_income: number;
  };
  expense_tracking: {
    current_year_giving: number;
    current_year_savings: number;
    current_year_debt: number;
    current_year_taxes: number;
    current_year_living_expenses: number;
    total_expenses: number;
    margin: number;
  };
  insurance_coverage: {
    life_insurance: number;
    disability: number;
    ltc: number;
    umbrella: number;
    business_insurance: number;
    flood_insurance: number;
    at_risk: number;
  };
  future_planning_ratios: {
    retirement_ratio: number | null;
    survivor_ratio: number | null;
    education_ratio: number | null;
    new_cars_ratio: number | null;
    ltc_ratio: number | null;
    ltd_ratio: number | null;
  };
  wisdom_index_ratios: {
    savings_ratio: number | null;
    giving_ratio: number | null;
    reserves_ratio: number | null;
    debt_ratio: number | null;
    diversification_ratio: number | null;
  };
}

interface ClientDetailViewProps {
  client: Client;
}

export function ClientDetailView({ client }: ClientDetailViewProps) {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targets, setTargets] = useState<Record<string, number | null>>({});
  const [targetsLoaded, setTargetsLoaded] = useState(false);

  useEffect(() => {
    loadClientMetrics();
  }, [client.client_id]);

  const loadClientMetrics = async () => {
    try {
      setIsLoading(true);
      setTargetsLoaded(false);
      const token = getAuthToken();

      const metricsPromise = fetch(buildApiUrl(`/api/admin/client/${client.client_id}/metrics`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const targetsPromise = fetch(buildApiUrl(`/api/admin/client/${client.client_id}/targets`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const [metricsResponse, targetsResponse] = await Promise.all([metricsPromise, targetsPromise]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      } else {
        setMetrics(null);
      }

      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        setTargets(targetsData.targets || {});
      } else {
        setTargets({});
      }
    } catch (error) {
      console.error('Error loading client metrics or targets:', error);
    } finally {
      setIsLoading(false);
      setTargetsLoaded(true);
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

  const formatRatio = (value: number | null) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return value.toFixed(2);
  };

  const getTargetValue = (metricName: string): number | null => {
    return targets?.[metricName] ?? null;
  };

  // Enhanced MetricCard with sophisticated styling and category-specific designs
  const MetricCard = ({
    title,
    value,
    isRatio = false,
    category = 'default',
    icon,
    metricKey
  }: {
    title: string;
    value: number | null;
    isRatio?: boolean;
    category?: 'assets' | 'income' | 'expenses' | 'insurance' | 'planning' | 'wisdom' | 'default';
    icon?: React.ReactNode;
    metricKey: string;
  }) => {
    // Category-specific color schemes - professional muted tones
    const categoryStyles = {
      assets: {
        borderTopColor: 'border-t-slate-700',
        borderTopHoverColor: 'hover:border-t-slate-800',
        shadowHoverColor: 'hover:shadow-slate-100'
      },
      income: {
        borderTopColor: 'border-t-emerald-600',
        borderTopHoverColor: 'hover:border-t-emerald-700',
        shadowHoverColor: 'hover:shadow-emerald-50'
      },
      expenses: {
        borderTopColor: 'border-t-rose-600',
        borderTopHoverColor: 'hover:border-t-rose-700',
        shadowHoverColor: 'hover:shadow-rose-50'
      },
      insurance: {
        borderTopColor: 'border-t-amber-600',
        borderTopHoverColor: 'hover:border-t-amber-700',
        shadowHoverColor: 'hover:shadow-amber-50'
      },
      planning: {
        borderTopColor: 'border-t-indigo-600',
        borderTopHoverColor: 'hover:border-t-indigo-700',
        shadowHoverColor: 'hover:shadow-indigo-50'
      },
      wisdom: {
        borderTopColor: 'border-t-sky-600',
        borderTopHoverColor: 'hover:border-t-sky-700',
        shadowHoverColor: 'hover:shadow-sky-50'
      },
      default: {
        borderTopColor: 'border-t-gray-400',
        borderTopHoverColor: 'hover:border-t-gray-500',
        shadowHoverColor: 'hover:shadow-gray-50'
      }
    };

    const styles = categoryStyles[category] || categoryStyles.default;
    const displayValue = isRatio ? formatRatio(value) : (value !== null && value !== undefined ? formatCurrency(value) : 'N/A');
    const formatMetricDisplay = (metricValue: number) => (isRatio ? formatRatio(metricValue) : formatCurrency(metricValue));
    const targetValue = getTargetValue(metricKey);
    const formattedTargetValue = targetValue !== null && targetValue !== undefined ? formatMetricDisplay(targetValue) : null;

    let targetBadge: { text: string; className: string } | null = null;
    if (targetsLoaded) {
      if (targetValue === null || targetValue === undefined) {
        targetBadge = {
          text: 'No Target',
          className: 'bg-gray-100 text-gray-600 border-gray-300'
        };
      } else if (value === null || value === undefined) {
        targetBadge = {
          text: 'No Data',
          className: 'bg-gray-100 text-gray-600 border-gray-300'
        };
      } else {
        const diff = value - targetValue;
        if (Math.abs(diff) < 0.0001) {
          targetBadge = {
            text: 'On Target',
            className: 'bg-yellow-50 text-yellow-700 border-yellow-300'
          };
        } else {
          const hasPercent = Math.abs(targetValue) > 0.0001;
          const percentDiff = hasPercent ? (diff / Math.abs(targetValue)) * 100 : null;
          const diffText = percentDiff !== null
            ? `${diff > 0 ? '↑' : '↓'} ${Math.abs(percentDiff).toFixed(1)}%`
            : `${diff > 0 ? '+' : '-'}${formatMetricDisplay(Math.abs(diff))}`;
          targetBadge = {
            text: diffText,
            className: diff > 0
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-red-50 text-red-700 border-red-300'
          };
        }
      }
    }

    return (
      <Card
        className={`group relative flex flex-col overflow-hidden border shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 bg-white backdrop-blur-sm border-t-4 ${styles.borderTopColor} ${styles.borderTopHoverColor} ${styles.shadowHoverColor} aspect-square min-h-[7rem] sm:min-h-[8rem]`}
      >
        <div className="relative flex flex-1 flex-col p-3 gap-2 justify-center items-center">
          {/* Centered metric content */}
          <div className="flex flex-1 flex-col items-center justify-center text-center gap-1">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-tight leading-tight">
              {title}
            </h4>
            <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              {displayValue}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            {!targetsLoaded ? (
              <>
                <div className="h-1 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="h-1 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              </>
            ) : (
              <>
                <span className="text-[0.65rem] sm:text-xs font-medium text-gray-600 leading-tight">
                  {formattedTargetValue ? `Target: ${formattedTargetValue}` : 'No target'}
                </span>
                {targetBadge && (
                  <span className={`text-[0.6rem] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md border ${targetBadge.className} leading-none shadow-sm`}>
                    {targetBadge.text}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Helper function to determine metric category based on title
  const getMetricCategory = (title: string): 'assets' | 'income' | 'expenses' | 'insurance' | 'planning' | 'wisdom' | 'default' => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('net worth') || titleLower.includes('portfolio') || titleLower.includes('real estate') ||
      titleLower.includes('debt') || titleLower.includes('equity') || titleLower.includes('fixed income') ||
      titleLower.includes('cash')) {
      return 'assets';
    }

    if (titleLower.includes('income') || titleLower.includes('pension') || titleLower.includes('social security')) {
      return 'income';
    }

    if (titleLower.includes('expense') || titleLower.includes('giving') || titleLower.includes('savings') ||
      titleLower.includes('taxes') || titleLower.includes('living') || titleLower.includes('margin')) {
      return 'expenses';
    }

    if (titleLower.includes('insurance') || titleLower.includes('ltc') || titleLower.includes('umbrella') ||
      titleLower.includes('disability') || titleLower.includes('life') || titleLower.includes('flood') ||
      titleLower.includes('business') || titleLower.includes('at risk')) {
      return 'insurance';
    }

    if (titleLower.includes('savings ratio') || titleLower.includes('giving ratio') ||
      titleLower.includes('reserves') || titleLower.includes('debt ratio') ||
      titleLower.includes('diversification')) {
      return 'wisdom';
    }

    if (titleLower.includes('ratio') || titleLower.includes('retirement') || titleLower.includes('survivor') ||
      titleLower.includes('education') || titleLower.includes('cars')) {
      return 'planning';
    }

    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Executive Client Profile Card */}
      <Card className="overflow-hidden border-0 shadow-xl bg-white">
        {/* Gradient Header Section */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-3 py-2 relative overflow-hidden">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -mr-8 -mt-8"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full -ml-6 -mb-6"></div>
          </div>

          {/* Client Name and ID */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white mb-0.5 tracking-tight truncate">
                {client.first_name} {client.last_name}
              </h2>
              <div className="flex items-center gap-1 text-blue-100">
                <Fingerprint className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-medium truncate">ID: {client.client_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid Section */}
        <div className="p-3 bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

            {/* Primary Information Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary Information</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                  <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Name</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {client.first_name} {client.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Client ID</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">#{client.client_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Information</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                  <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{client.email}</p>
                  </div>
                </div>

                {client.username && (
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Username</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">{client.username}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Status</h3>
              <div className="space-y-1.5">
                {/* Enhanced Account Status Badge */}
                <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                  {client.has_account ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge
                        variant={client.has_account ? "default" : "secondary"}
                        className={`${client.has_account
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-800 text-xs'
                          : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-800 text-xs'
                          }`}
                      >
                        {client.has_account ? 'Active' : 'No Account'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {client.last_login && (
                  <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Last Login</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {new Date(client.last_login).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        {/* Enhanced Tab Navigation */}
        <div className="relative">
          {/* Background decorative element */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>

          {/* Tab Container */}
          <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 p-1">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-1 h-auto p-0 bg-transparent">
              {/* Overview Tab */}
              <TabsTrigger
                value="overview"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Overview</span>
              </TabsTrigger>

              {/* Assets & Liabilities Tab */}
              <TabsTrigger
                value="assets"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-700 data-[state=active]:to-blue-900 data-[state=active]:text-white transition-all duration-300 hover:bg-blue-50"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Assets</span>
              </TabsTrigger>

              {/* Income & Expenses Tab */}
              <TabsTrigger
                value="income"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-700 data-[state=active]:to-teal-900 data-[state=active]:text-white transition-all duration-300 hover:bg-teal-50"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Income</span>
              </TabsTrigger>

              {/* Insurance Tab */}
              <TabsTrigger
                value="insurance"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-stone-700 data-[state=active]:to-stone-900 data-[state=active]:text-white transition-all duration-300 hover:bg-stone-50"
              >
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Insurance</span>
              </TabsTrigger>

              {/* Future Planning Tab */}
              <TabsTrigger
                value="planning"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-700 data-[state=active]:to-indigo-900 data-[state=active]:text-white transition-all duration-300 hover:bg-indigo-50"
              >
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Planning</span>
              </TabsTrigger>

              {/* Wisdom Index Tab */}
              <TabsTrigger
                value="wisdom"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-700 data-[state=active]:to-sky-900 data-[state=active]:text-white transition-all duration-300 hover:bg-cyan-50"
              >
                <PieChart className="w-4 h-4" />
                <span className="text-xs font-medium text-center leading-tight">Wisdom</span>
              </TabsTrigger>

              {/* History Tab */}
              <TabsTrigger
                value="history"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-700 data-[state=active]:to-gray-900 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-50"
              >
                <History className="w-4 h-4" />
                <span className="text-xs font-medium">History</span>
              </TabsTrigger>

              {/* Target Management Tab */}
              <TabsTrigger
                value="targets"
                className="group relative flex flex-col items-center gap-1 p-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-neutral-700 data-[state=active]:to-neutral-900 data-[state=active]:text-white transition-all duration-300 hover:bg-neutral-50"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs font-medium">Targets</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading...</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              <MetricCard
                title="Net Worth"
                metricKey="net-worth"
                value={metrics.assets_and_liabilities.net_worth}
                category="assets"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <MetricCard
                title="Portfolio Value"
                metricKey="portfolio-value"
                value={metrics.assets_and_liabilities.portfolio_value}
                category="assets"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <MetricCard
                title="Total Income"
                metricKey="total-income"
                value={metrics.income_analysis.total_income}
                category="income"
                icon={<Briefcase className="w-5 h-5" />}
              />
              <MetricCard
                title="Total Expenses"
                metricKey="total-expenses"
                value={metrics.expense_tracking.total_expenses}
                category="expenses"
                icon={<CreditCard className="w-5 h-5" />}
              />
              <MetricCard
                title="Margin"
                metricKey="margin"
                value={metrics.expense_tracking.margin}
                category="expenses"
                icon={<Calculator className="w-5 h-5" />}
              />
              <MetricCard
                title="Life Insurance"
                metricKey="life-insurance"
                value={metrics.insurance_coverage.life_insurance}
                category="insurance"
                icon={<Heart className="w-5 h-5" />}
              />
              <MetricCard
                title="Retirement Ratio"
                metricKey="retirement-ratio"
                value={metrics.future_planning_ratios.retirement_ratio}
                isRatio
                category="planning"
                icon={<Target className="w-5 h-5" />}
              />
              <MetricCard
                title="Survivor Ratio"
                metricKey="survivor-ratio"
                value={metrics.future_planning_ratios.survivor_ratio}
                isRatio
                category="planning"
                icon={<Shield className="w-5 h-5" />}
              />
              <MetricCard
                title="Education Ratio"
                metricKey="education-ratio"
                value={metrics.future_planning_ratios.education_ratio}
                isRatio
                category="planning"
                icon={<Building className="w-5 h-5" />}
              />
              <MetricCard
                title="Savings Ratio"
                metricKey="savings-ratio"
                value={metrics.wisdom_index_ratios.savings_ratio}
                isRatio
                category="wisdom"
                icon={<PiggyBank className="w-5 h-5" />}
              />
              <MetricCard
                title="Giving Ratio"
                metricKey="giving-ratio"
                value={metrics.wisdom_index_ratios.giving_ratio}
                isRatio
                category="wisdom"
                icon={<Heart className="w-5 h-5" />}
              />
              <MetricCard
                title="Reserves Ratio"
                metricKey="reserves-ratio"
                value={metrics.wisdom_index_ratios.reserves_ratio}
                isRatio
                category="wisdom"
                icon={<Umbrella className="w-5 h-5" />}
              />
              <MetricCard
                title="Debt Ratio"
                metricKey="debt-ratio"
                value={metrics.wisdom_index_ratios.debt_ratio}
                isRatio
                category="wisdom"
                icon={<TrendingDown className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="text-center py-8">No metrics data available</div>
          )}
        </TabsContent>

        <TabsContent value="assets">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading assets...</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              <MetricCard
                title="Net Worth"
                metricKey="net-worth"
                value={metrics.assets_and_liabilities.net_worth}
                category="assets"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <MetricCard
                title="Portfolio Value"
                metricKey="portfolio-value"
                value={metrics.assets_and_liabilities.portfolio_value}
                category="assets"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <MetricCard
                title="Real Estate Value"
                metricKey="real-estate-value"
                value={metrics.assets_and_liabilities.real_estate_value}
                category="assets"
                icon={<Home className="w-5 h-5" />}
              />
              <MetricCard
                title="Debt"
                metricKey="debt"
                value={metrics.assets_and_liabilities.debt}
                category="assets"
                icon={<CreditCard className="w-5 h-5" />}
              />
              <MetricCard
                title="Equity"
                metricKey="equity"
                value={metrics.assets_and_liabilities.equity}
                category="assets"
                icon={<BarChart3 className="w-5 h-5" />}
              />
              <MetricCard
                title="Fixed Income"
                metricKey="fixed-income"
                value={metrics.assets_and_liabilities.fixed_income}
                category="assets"
                icon={<PiggyBank className="w-5 h-5" />}
              />
              <MetricCard
                title="Cash"
                metricKey="cash"
                value={metrics.assets_and_liabilities.cash}
                category="assets"
                icon={<DollarSign className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="text-center py-8">No assets data available</div>
          )}
        </TabsContent>

        <TabsContent value="income">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading income...</p>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-3">Income Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                  <MetricCard
                    title="Earned Income"
                    metricKey="earned-income"
                    value={metrics.income_analysis.earned_income}
                    category="income"
                    icon={<Briefcase className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Social Security"
                    metricKey="social-security-income"
                    value={metrics.income_analysis.social_security_income}
                    category="income"
                    icon={<Shield className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Pension"
                    metricKey="pension-income"
                    value={metrics.income_analysis.pension_income}
                    category="income"
                    icon={<Calculator className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Real Estate Income"
                    metricKey="real-estate-income"
                    value={metrics.income_analysis.real_estate_income}
                    category="income"
                    icon={<Home className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Business Income"
                    metricKey="business-income"
                    value={metrics.income_analysis.business_income}
                    category="income"
                    icon={<Building className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Total Income"
                    metricKey="total-income"
                    value={metrics.income_analysis.total_income}
                    category="income"
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-3">Expense Tracking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                  <MetricCard
                    title="Giving"
                    metricKey="current-year-giving"
                    value={metrics.expense_tracking.current_year_giving}
                    category="expenses"
                    icon={<Heart className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Savings"
                    metricKey="current-year-savings"
                    value={metrics.expense_tracking.current_year_savings}
                    category="expenses"
                    icon={<PiggyBank className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Debt Payments"
                    metricKey="current-year-debt"
                    value={metrics.expense_tracking.current_year_debt}
                    category="expenses"
                    icon={<CreditCard className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Taxes"
                    metricKey="current-year-taxes"
                    value={metrics.expense_tracking.current_year_taxes}
                    category="expenses"
                    icon={<Calculator className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Living Expenses"
                    metricKey="current-year-living-expenses"
                    value={metrics.expense_tracking.current_year_living_expenses}
                    category="expenses"
                    icon={<Home className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Total Expenses"
                    metricKey="total-expenses"
                    value={metrics.expense_tracking.total_expenses}
                    category="expenses"
                    icon={<CreditCard className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Margin"
                    metricKey="margin"
                    value={metrics.expense_tracking.margin}
                    category="expenses"
                    icon={<Activity className="w-5 h-5" />}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">No income data available</div>
          )}
        </TabsContent>

        <TabsContent value="insurance">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading insurance...</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              <MetricCard
                title="Life Insurance"
                metricKey="life-insurance"
                value={metrics.insurance_coverage.life_insurance}
                category="insurance"
                icon={<Heart className="w-5 h-5" />}
              />
              <MetricCard
                title="Disability"
                metricKey="disability"
                value={metrics.insurance_coverage.disability}
                category="insurance"
                icon={<Shield className="w-5 h-5" />}
              />
              <MetricCard
                title="Long-Term Care"
                metricKey="ltc"
                value={metrics.insurance_coverage.ltc}
                category="insurance"
                icon={<Umbrella className="w-5 h-5" />}
              />
              <MetricCard
                title="Umbrella"
                metricKey="umbrella"
                value={metrics.insurance_coverage.umbrella}
                category="insurance"
                icon={<Umbrella className="w-5 h-5" />}
              />
              <MetricCard
                title="Business Insurance"
                metricKey="business-insurance"
                value={metrics.insurance_coverage.business_insurance}
                category="insurance"
                icon={<Building className="w-5 h-5" />}
              />
              <MetricCard
                title="Flood Insurance"
                metricKey="flood-insurance"
                value={metrics.insurance_coverage.flood_insurance}
                category="insurance"
                icon={<Home className="w-5 h-5" />}
              />
              <MetricCard
                title="At Risk"
                metricKey="at-risk"
                value={metrics.insurance_coverage.at_risk}
                category="insurance"
                icon={<AlertCircle className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="text-center py-8">No insurance data available</div>
          )}
        </TabsContent>

        <TabsContent value="planning">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading planning...</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              <MetricCard
                title="Retirement Ratio"
                metricKey="retirement-ratio"
                value={metrics.future_planning_ratios.retirement_ratio}
                isRatio
                category="planning"
                icon={<Target className="w-5 h-5" />}
              />
              <MetricCard
                title="Survivor Ratio"
                metricKey="survivor-ratio"
                value={metrics.future_planning_ratios.survivor_ratio}
                isRatio
                category="planning"
                icon={<Shield className="w-5 h-5" />}
              />
              <MetricCard
                title="Education Ratio"
                metricKey="education-ratio"
                value={metrics.future_planning_ratios.education_ratio}
                isRatio
                category="planning"
                icon={<Building className="w-5 h-5" />}
              />
              <MetricCard
                title="New Cars Ratio"
                metricKey="new-cars-ratio"
                value={metrics.future_planning_ratios.new_cars_ratio}
                isRatio
                category="planning"
                icon={<Activity className="w-5 h-5" />}
              />
              <MetricCard
                title="LTC Ratio"
                metricKey="ltc-ratio"
                value={metrics.future_planning_ratios.ltc_ratio}
                isRatio
                category="planning"
                icon={<Umbrella className="w-5 h-5" />}
              />
              <MetricCard
                title="LTD Ratio"
                metricKey="ltd-ratio"
                value={metrics.future_planning_ratios.ltd_ratio}
                isRatio
                category="planning"
                icon={<Shield className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="text-center py-8">No planning ratios data available</div>
          )}
        </TabsContent>

        <TabsContent value="wisdom">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading wisdom...</p>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              <MetricCard
                title="Savings Ratio"
                metricKey="savings-ratio"
                value={metrics.wisdom_index_ratios.savings_ratio}
                isRatio
                category="wisdom"
                icon={<PiggyBank className="w-5 h-5" />}
              />
              <MetricCard
                title="Giving Ratio"
                metricKey="giving-ratio"
                value={metrics.wisdom_index_ratios.giving_ratio}
                isRatio
                category="wisdom"
                icon={<Heart className="w-5 h-5" />}
              />
              <MetricCard
                title="Reserves Ratio"
                metricKey="reserves-ratio"
                value={metrics.wisdom_index_ratios.reserves_ratio}
                isRatio
                category="wisdom"
                icon={<Umbrella className="w-5 h-5" />}
              />
              <MetricCard
                title="Debt Ratio"
                metricKey="debt-ratio"
                value={metrics.wisdom_index_ratios.debt_ratio}
                isRatio
                category="wisdom"
                icon={<TrendingDown className="w-5 h-5" />}
              />
              <MetricCard
                title="Diversification Ratio"
                metricKey="diversification-ratio"
                value={metrics.wisdom_index_ratios.diversification_ratio}
                isRatio
                category="wisdom"
                icon={<PieChart className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="text-center py-8">No Wisdom Index data available</div>
          )}
        </TabsContent>

        <TabsContent value="targets">
          <TargetManagement clientId={client.client_id} />
        </TabsContent>

        <TabsContent value="history">
          <AdminAccountHistoryView authToken={getAuthToken()} clientId={client.client_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
