'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface AnalyticsData {
  total_aum: number;
  asset_breakdown: {
    holdings: number;
    real_estate: number;
    businesses: number;
    investments: number;
    personal_property: number;
  };
  total_clients: number;
  active_client_accounts: number;
  total_income: number;
  total_expenses: number;
  total_margin: number;
  target_statistics: {
    clients_with_targets: number;
    total_clients: number;
    total_targets_set: number;
    target_adoption_rate: number;
  };
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  useEffect(() => {
    console.log('[AdminAnalytics] Component mounting...');
    loadAnalytics();
  }, []);

  const loadAnalytics = async (isRefresh = false) => {
    console.log(`[AdminAnalytics] ${isRefresh ? 'Refreshing' : 'Loading'} analytics...`);
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const token = getAuthToken();
      console.log('[AdminAnalytics] Token exists:', !!token);
      
      if (!token) {
        console.error('[AdminAnalytics] No auth token found');
        setIsLoading(false);
        return;
      }
      
      const apiUrl = buildApiUrl('/api/admin/analytics');
      console.log('[AdminAnalytics] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminAnalytics] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AdminAnalytics] Analytics data:', data);
        setAnalytics(data);
        
        // Show success notification for refresh operations
        if (isRefresh) {
          setShowRefreshSuccess(true);
          setTimeout(() => setShowRefreshSuccess(false), 3000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AdminAnalytics] API Error:', response.status, errorData);
      }
    } catch (error) {
      console.error('[AdminAnalytics] Error loading analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const percentOfTotal = (value: number, total: number) => {
    if (!total) {
      return 0;
    }

    const ratio = (value / total) * 100;
    if (!Number.isFinite(ratio)) {
      return 0;
    }

    return Math.max(0, Math.min(ratio, 100));
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Unable to load data</p>
      </div>
    );
  }

  const averageAum = analytics.total_clients ? analytics.total_aum / analytics.total_clients : 0;
  const activationRate = percentOfTotal(analytics.active_client_accounts, analytics.total_clients);
  const marginRate = analytics.total_income
    ? (analytics.total_margin / analytics.total_income) * 100
    : 0;
  const expenseRatio = analytics.total_income
    ? (analytics.total_expenses / analytics.total_income) * 100
    : 0;

  const elevatedSurface =
    'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-sm';

  const keyMetricCards = [
    {
      id: 'aum',
      title: 'Total AUM',
      subtitle: 'Firm-wide managed assets',
      value: formatCurrency(analytics.total_aum),
      chipLabel: 'Avg / client',
      chipValue: formatCurrency(averageAum),
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      iconAccent: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'clients',
      title: 'Client Coverage',
      subtitle: 'Relationships under advisory',
      value: `${analytics.total_clients.toLocaleString()} clients`,
      chipLabel: 'Active accounts',
      chipValue: `${analytics.active_client_accounts.toLocaleString()} engaged`,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      iconAccent: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      insightLabel: 'Account activation',
      insightValue: formatPercentage(activationRate),
      insightAccent: 'from-emerald-500 to-green-400',
      insightWidth: activationRate,
    },
    {
      id: 'income',
      title: 'Revenue Run Rate',
      subtitle: 'Income across portfolios',
      value: formatCurrency(analytics.total_income),
      chipLabel: 'Operating margin',
      chipValue: `${formatPercentage(marginRate)}`,
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      iconAccent: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
    },
    {
      id: 'expenses',
      title: 'Operating Expenses',
      subtitle: 'Firm-wide spend',
      value: formatCurrency(analytics.total_expenses),
      chipLabel: 'Efficiency ratio',
      chipValue: `${formatPercentage(expenseRatio)}`,
      gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
      iconAccent: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  const assetAllocationCards = [
    {
      id: 'holdings',
      label: 'Holdings',
      value: analytics.asset_breakdown.holdings,
      iconAccent: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
      textAccent: 'text-blue-600',
      barAccent: 'from-blue-500 via-indigo-500 to-indigo-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'real_estate',
      label: 'Real Estate',
      value: analytics.asset_breakdown.real_estate,
      iconAccent: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
      textAccent: 'text-rose-600',
      barAccent: 'from-rose-500 via-pink-500 to-orange-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9.5L12 4l9 5.5M5 10v10h4v-6h6v6h4V10"
          />
        </svg>
      ),
    },
    {
      id: 'businesses',
      label: 'Private Businesses',
      value: analytics.asset_breakdown.businesses,
      iconAccent: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
      textAccent: 'text-slate-700',
      barAccent: 'from-slate-600 via-slate-500 to-slate-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7"
          />
        </svg>
      ),
    },
    {
      id: 'investments',
      label: 'Structured Investments',
      value: analytics.asset_breakdown.investments,
      iconAccent: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
      textAccent: 'text-amber-600',
      barAccent: 'from-amber-500 via-orange-500 to-yellow-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'personal_property',
      label: 'Personal Property',
      value: analytics.asset_breakdown.personal_property,
      iconAccent: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      textAccent: 'text-emerald-600',
      barAccent: 'from-emerald-500 via-green-500 to-lime-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
    },
  ].map((asset) => ({
    ...asset,
    formattedValue: formatCurrency(asset.value),
    share: percentOfTotal(asset.value, analytics.total_aum),
  }));
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Firm Analytics</h2>
            <p className="text-gray-300 text-sm">Financial advisory practice overview</p>
          </div>
          <Button
            onClick={() => loadAnalytics(true)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
          >
            <svg
              className={`w-4 h-4 mr-1 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m6 6v-5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Refresh Success Notification */}
      {showRefreshSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded shadow-md p-3 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs font-medium text-green-800">Data refreshed</p>
            <p className="text-xs text-green-600">Analytics updated</p>
          </div>
        </motion.div>
      )}

      {/* Key Metrics */}
      <motion.div
        className="grid auto-rows-fr grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
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
        {keyMetricCards.map((metric) => (
          <motion.div
            key={metric.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <Card className={`${elevatedSurface} p-4 group min-w-0 h-full flex flex-col`}>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden="true"
              ></div>
              <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.45),_transparent_55%)]" aria-hidden="true"></div>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 leading-tight break-words">
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-500">{metric.subtitle}</p>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${metric.iconAccent} shrink-0`}>
                  <div className="w-4 h-4">{metric.icon}</div>
                </div>
              </div>
              {metric.insightLabel && (
                <div className="relative z-10 mt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.6rem] font-medium text-slate-500">
                    <span>{metric.insightLabel}</span>
                    <span className="text-slate-900">{metric.insightValue}</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${metric.insightAccent || 'from-slate-900 to-slate-600'}`}
                      style={{ width: `${Math.min(metric.insightWidth ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="mt-auto">
                <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100/70 bg-white/85 px-2 py-1.5 text-xs font-medium text-slate-500 shadow-inner">
                  <span className="text-[0.55rem] uppercase tracking-[0.2em] text-slate-400">{metric.chipLabel}</span>
                  <span className="text-xs font-semibold text-slate-900 break-words">{metric.chipValue}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Asset Breakdown */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.3 } }
        }}
      >
        <Card className={`${elevatedSurface} p-4 min-w-0`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">Allocation</p>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5">Asset Breakdown</h3>
              <p className="text-xs text-slate-500">Diversification across client portfolios</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-900/5 px-2 py-1 font-semibold text-slate-700">
                {formatCurrency(analytics.total_aum)}
              </span>
              <span className="text-slate-400">Updated</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
            {assetAllocationCards.map((asset) => (
              <motion.div
                key={asset.id}
                className="group rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-inner transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 min-w-0"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.5rem] font-semibold uppercase tracking-[0.3em] text-slate-500">{asset.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 leading-tight break-words">{asset.formattedValue}</p>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${asset.iconAccent} shrink-0`}>
                    <div className="w-4 h-4">{asset.icon}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Share of AUM</span>
                    <span className={`font-semibold ${asset.textAccent}`}>{formatPercentage(asset.share)}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${asset.barAccent}`}
                      style={{ width: `${asset.share}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Summary Statistics */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              delay: 0.4,
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}>
          <Card className={`${elevatedSurface} p-4 min-w-0`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">Engagement</p>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">Target Adoption</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="divide-y divide-slate-100/70 rounded-lg border border-slate-100/70 bg-white/80">
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Clients with Targets</span>
                <span className="text-xs font-semibold text-slate-900">
                  {analytics.target_statistics.clients_with_targets} / {analytics.target_statistics.total_clients}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Adoption Rate</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {formatPercentage(analytics.target_statistics.target_adoption_rate)}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Total Targets Set</span>
                <span className="text-xs font-semibold text-slate-900">
                  {analytics.target_statistics.total_targets_set}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Adoption Pace</span>
                <span className="text-indigo-600">{formatPercentage(analytics.target_statistics.target_adoption_rate)}</span>
              </div>
              <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" style={{width: `${Math.min(analytics.target_statistics.target_adoption_rate, 100)}%`}}></div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}>
          <Card className={`${elevatedSurface} p-4 min-w-0`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">Performance</p>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">Financial Summary</h3>
              </div>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100 shrink-0">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="divide-y divide-slate-100/70 rounded-lg border border-slate-100/70 bg-white/80">
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Total Margin</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${analytics.total_margin >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {formatCurrency(analytics.total_margin)}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Average AUM per Client</span>
                <span className="text-xs font-semibold text-slate-900">
                  {formatCurrency(averageAum)}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Account Activation</span>
                <span className="text-xs font-semibold text-teal-600">
                  {formatPercentage(activationRate)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Activation</span>
                <span className="text-teal-600">{formatPercentage(activationRate)}</span>
              </div>
              <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-400" style={{width: `${Math.min(activationRate, 100)}%`}}></div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

    </div>
  );
}


