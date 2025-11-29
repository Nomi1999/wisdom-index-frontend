'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as XLSX from 'xlsx';
import { isAuthenticated, removeToken, validateSessionOwnership, getStoredUser, getCurrentUser } from '@/utils/sessionAuth';
import { useSessionAuth } from '@/hooks/useSessionAuth';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { MetricDetailModal } from '@/components/MetricDetailModal';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ClientDashboardView } from '@/types/dashboard';
import { buildApiUrl } from '@/lib/api';
import { socket } from '@/lib/socket';
import { MobileLoadingScreen } from '@/components/dashboard/MobileLoadingScreen';

// Metrics by category for target management
const metricsByCategory = {
  'Assets & Liabilities': [
    { name: 'net-worth', title: 'Net Worth', isRatio: false },
    { name: 'portfolio-value', title: 'Portfolio Value', isRatio: false },
    { name: 'real-estate-value', title: 'Real Estate Value', isRatio: false },
    { name: 'debt', title: 'Debt', isRatio: false },
    { name: 'equity', title: 'Equity', isRatio: false },
    { name: 'fixed-income', title: 'Fixed Income', isRatio: false },
    { name: 'cash', title: 'Cash', isRatio: false }
  ],
  'Income Analysis': [
    { name: 'earned-income', title: 'Earned Income', isRatio: false },
    { name: 'social-security-income', title: 'Social Security Income', isRatio: false },
    { name: 'pension-income', title: 'Pension Income', isRatio: false },
    { name: 'real-estate-income', title: 'Real Estate Income', isRatio: false },
    { name: 'business-income', title: 'Business Income', isRatio: false },
    { name: 'total-income', title: 'Total Income', isRatio: false }
  ],
  'Expense Tracking': [
    { name: 'current-year-giving', title: 'Current Year Giving', isRatio: false },
    { name: 'current-year-savings', title: 'Current Year Savings', isRatio: false },
    { name: 'current-year-debt', title: 'Current Year Debt', isRatio: false },
    { name: 'current-year-taxes', title: 'Current Year Taxes', isRatio: false },
    { name: 'current-year-living-expenses', title: 'Current Year Living Expenses', isRatio: false },
    { name: 'total-expenses', title: 'Total Expenses', isRatio: false },
    { name: 'margin', title: 'Margin', isRatio: false }
  ],
  'Insurance Coverage': [
    { name: 'life-insurance', title: 'Life Insurance', isRatio: false },
    { name: 'disability', title: 'Disability', isRatio: false },
    { name: 'ltc', title: 'LTC', isRatio: false },
    { name: 'umbrella', title: 'Umbrella', isRatio: false },
    { name: 'business-insurance', title: 'Business Insurance', isRatio: false },
    { name: 'flood-insurance', title: 'Flood Insurance', isRatio: false },
    { name: 'at-risk', title: 'At Risk', isRatio: false }
  ],
  'Future Planning Ratios': [
    { name: 'retirement-ratio', title: 'Retirement Ratio', isRatio: true },
    { name: 'survivor-ratio', title: 'Survivor Ratio', isRatio: true },
    { name: 'education-ratio', title: 'Education Ratio', isRatio: true },
    { name: 'new-cars-ratio', title: 'New Cars Ratio', isRatio: true },
    { name: 'ltc-ratio', title: 'LTC Ratio', isRatio: true },
    { name: 'ltd-ratio', title: 'LTD Ratio', isRatio: true }
  ],
  'Wisdom Index Ratios': [
    { name: 'savings-ratio', title: 'Savings Ratio', isRatio: true },
    { name: 'giving-ratio', title: 'Giving Ratio', isRatio: true },
    { name: 'reserves-ratio', title: 'Reserves', isRatio: true },
    { name: 'debt-ratio', title: 'Debt Ratio', isRatio: true },
    { name: 'diversification-ratio', title: 'Diversification', isRatio: true }
  ]
};

export default function Dashboard() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [clientName, setClientName] = useState('Loading...');
  const [metricsData, setMetricsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [targetsLoaded, setTargetsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'exported'>('idle');
  const exportTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [insightsOverlayOpen, setInsightsOverlayOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsContent, setInsightsContent] = useState('');
  const [cachedInsights, setCachedInsights] = useState<string | null>(null);
  const [hasGeneratedInsights, setHasGeneratedInsights] = useState(false);
  const [insightsSlideUp, setInsightsSlideUp] = useState(false);
  const [activeView, setActiveView] = useState<ClientDashboardView>('dashboard');
  const [isDeviceDetected, setIsDeviceDetected] = useState(false);

  // Profile data state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileError, setProfileError] = useState(false);

  // Profile update handler
  const handleProfileUpdate = (updatedProfile: any) => {
    setProfileData(updatedProfile);
  };

  // Initial device detection to prevent flash
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = window.navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent) || width <= 768;
      
      // Small delay to ensure consistent rendering
      setTimeout(() => {
        setIsDeviceDetected(true);
      }, 50);
    };

    // Check immediately
    checkDevice();
  }, []);

  // Targets management state
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsData, setTargetsData] = useState<Record<string, number>>({});
  const [originalTargetsData, setOriginalTargetsData] = useState<Record<string, number>>({});
  const [targetsError, setTargetsError] = useState(false);
  const [saveTargetsLoading, setSaveTargetsLoading] = useState(false);
  const [resetTargetsLoading, setResetTargetsLoading] = useState(false);
  const [saveTargetsSuccess, setSaveTargetsSuccess] = useState(false);
  const [resetTargetsSuccess, setResetTargetsSuccess] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetConfirmationClosing, setResetConfirmationClosing] = useState(false);

  // Account history modal state

  // Metric detail modal state
  const [metricDetailModalOpen, setMetricDetailModalOpen] = useState(false);
  const [selectedMetricName, setSelectedMetricName] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Chart data cache for export
  const [chartDataCache, setChartDataCache] = useState<{
    income: any[] | null;
    expense: any[] | null;
  }>({
    income: null,
    expense: null
  });
  const [chartsPrefetched, setChartsPrefetched] = useState(false);

  const isMountedRef = useRef(true);

  // Metric definitions - imported from MetricCard component
  const metrics = [
    // Row 1: Assets & Liabilities (7 cards - all dark blue shades - darkest)
    { name: 'net-worth', title: 'Net Worth', category: 'assets', isRatio: false },
    { name: 'portfolio-value', title: 'Portfolio Value', category: 'assets', isRatio: false },
    { name: 'real-estate-value', title: 'Real Estate', category: 'assets', isRatio: false },
    { name: 'debt', title: 'Debt', category: 'assets', isRatio: false },
    { name: 'equity', title: 'Equity', category: 'assets', isRatio: false },
    { name: 'fixed-income', title: 'Fixed Income', category: 'assets', isRatio: false },
    { name: 'cash', title: 'Cash', category: 'assets', isRatio: false },

    // Row 2: Income (6 cards - all dark blue shades - very dark + 1 empty)
    { name: 'earned-income', title: 'Earned Income', category: 'income', isRatio: false },
    { name: 'social-security-income', title: 'Social Security', category: 'income', isRatio: false },
    { name: 'pension-income', title: 'Pension', category: 'income', isRatio: false },
    { name: 'real-estate-income', title: 'RE Income', category: 'income', isRatio: false },
    { name: 'business-income', title: 'Business Inc', category: 'income', isRatio: false },
    { name: 'total-income', title: 'Total Income', category: 'income', isRatio: false },
    null, // Empty card

    // Row 3: Expenses (7 cards - all dark blue shades - dark)
    { name: 'current-year-giving', title: 'Giving', category: 'expenses', isRatio: false },
    { name: 'current-year-savings', title: 'Savings', category: 'expenses', isRatio: false },
    { name: 'current-year-debt', title: 'Debt Payments', category: 'expenses', isRatio: false },
    { name: 'current-year-taxes', title: 'Taxes', category: 'expenses', isRatio: false },
    { name: 'current-year-living-expenses', title: 'Living Exp', category: 'expenses', isRatio: false },
    { name: 'total-expenses', title: 'Total Exp', category: 'expenses', isRatio: false },
    { name: 'margin', title: 'Margin', category: 'expenses', isRatio: false },

    // Row 4: Insurance (7 cards - all dark blue shades - medium-dark)
    { name: 'life-insurance', title: 'Life Ins', category: 'insurance', isRatio: false },
    { name: 'disability', title: 'Disability', category: 'insurance', isRatio: false },
    { name: 'ltc', title: 'LTC', category: 'insurance', isRatio: false },
    { name: 'umbrella', title: 'Umbrella', category: 'insurance', isRatio: false },
    { name: 'business-insurance', title: 'Business Ins', category: 'insurance', isRatio: false },
    { name: 'flood-insurance', title: 'Flood Ins', category: 'insurance', isRatio: false },
    { name: 'at-risk', title: 'At Risk', category: 'insurance', isRatio: false },

    // Row 5: Future Planning (6 cards - all dark blue shades - medium + 1 empty)
    { name: 'retirement-ratio', title: 'Retirement', category: 'planning', isRatio: true },
    { name: 'survivor-ratio', title: 'Survivor', category: 'planning', isRatio: true },
    { name: 'education-ratio', title: 'Education', category: 'planning', isRatio: true },
    { name: 'new-cars-ratio', title: 'New Cars', category: 'planning', isRatio: true },
    { name: 'ltc-ratio', title: 'LTC Ratio', category: 'planning', isRatio: true },
    { name: 'ltd-ratio', title: 'LTD Ratio', category: 'planning', isRatio: true },
    null, // Empty card

    // Row 6: Wisdom Index Ratios (5 cards - all dark blue shades - medium + 2 empty)
    { name: 'savings-ratio', title: 'Savings Ratio', category: 'wisdom-index', isRatio: true },
    { name: 'giving-ratio', title: 'Giving Ratio', category: 'wisdom-index', isRatio: true },
    { name: 'reserves-ratio', title: 'Reserves', category: 'wisdom-index', isRatio: true },
    { name: 'debt-ratio', title: 'Debt Ratio', category: 'wisdom-index', isRatio: true },
    { name: 'diversification-ratio', title: 'Diversification', category: 'wisdom-index', isRatio: true },
    null, // Empty card
    null, // Empty card
  ];

  const computeTargetStatus = (actualValue: any, targetValue: any) => {
    if (
      targetValue === null ||
      targetValue === undefined ||
      actualValue === null ||
      actualValue === undefined ||
      (typeof targetValue === 'number' && Math.abs(targetValue) < 1e-9)
    ) {
      return { status: 'no-target', targetPercentage: null, targetDisplayText: null };
    }

    const actual = typeof actualValue === 'string' ? parseFloat(actualValue) : actualValue;
    const target = typeof targetValue === 'string' ? parseFloat(targetValue) : targetValue;

    if (isNaN(actual) || isNaN(target) || Math.abs(target) < 1e-9) {
      return { status: 'no-target', targetPercentage: null, targetDisplayText: null };
    }

    const percentage = ((actual / target) - 1) * 100;
    const absPercentage = Math.abs(percentage);

    if (actual > target) {
      return { status: 'above', targetPercentage: absPercentage, targetDisplayText: `+${absPercentage.toFixed(1)}%` };
    }
    if (actual < target) {
      return { status: 'below', targetPercentage: absPercentage, targetDisplayText: `-${absPercentage.toFixed(1)}%` };
    }

    return { status: 'equal', targetPercentage: 0, targetDisplayText: 'On target' };
  };

  const buildMetricsState = (
    metricValues: Record<string, any>,
    targets: Record<string, number | null | undefined>
  ) => {
    const nextState: Record<string, any> = {};

    metrics.forEach(metric => {
      if (!metric) return;
      const rawValue = metricValues?.[metric.name] ?? null;
      const targetValue = targets?.[metric.name] ?? null;
      const targetInfo = computeTargetStatus(rawValue, targetValue);

      nextState[metric.name] = {
        value: rawValue,
        formattedValue: formatValue(rawValue, metric.isRatio),
        target: targetValue ?? null,
        status: targetInfo.status,
        target_percentage: targetInfo.targetPercentage,
        target_display_text: targetInfo.targetDisplayText
      };
    });

    return nextState;
  };

  const applyTargetsToMetrics = (targets: Record<string, number | null | undefined>) => {
    setMetricsData(prev => {
      const updated = { ...prev };

      metrics.forEach(metric => {
        if (!metric) return;
        const entry = updated[metric.name] || {
          value: null,
          formattedValue: '-',
          target: null,
          status: 'no-target',
          target_percentage: null,
          target_display_text: null
        };

        const targetValue = targets?.[metric.name] ?? null;
        const targetInfo = computeTargetStatus(entry.value, targetValue);

        updated[metric.name] = {
          ...entry,
          target: targetValue,
          status: targetInfo.status,
          target_percentage: targetInfo.targetPercentage,
          target_display_text: targetInfo.targetDisplayText
        };
      });

      return updated;
    });

    setTargetsLoaded(true);
  };

  const normalizeChartData = (rawData: any[] | null | undefined, type: 'income' | 'expense') => {
    if (!Array.isArray(rawData)) {
      return null;
    }

    if (type === 'income') {
      return rawData.map(item => ({
        category: item.income_category || item.category || 'Income',
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0
      }));
    }

    return rawData.map(item => ({
      category: item.expense_category || item.category || 'Expense',
      amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0
    }));
  };

  // Intercept back button to logout automatically (same behavior as logout button)
  useEffect(() => {
    // Push a dummy state to intercept back button
    window.history.pushState({ preventBack: true }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // User clicked back - cancel it by going forward and then logout
      console.log('[Dashboard] Back button pressed, cancelling and logging out');

      // Cancel the back navigation by immediately going forward
      window.history.go(1);

      // Then logout with replace (same as logout button)
      setTimeout(() => {
        removeToken();
        window.location.replace('/login');
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

// Use session auth hook for validation
  const { isValid: sessionValid, isLoading: sessionLoading, user: sessionUser } = useSessionAuth({
    onSessionInvalid: () => {
      console.log('[Dashboard] Session validation failed, redirecting to login');
      removeToken();
      window.location.replace('/login');
    },
    validateOnMount: true,
    validateOnVisibilityChange: true,
    validateOnFocus: true
  });

  // Mobile detection for modal handling
  const { isMobile } = useMobileDetection();

  // Load token from sessionStorage synchronously before paint & verify auth
  useLayoutEffect(() => {
    console.log('[Dashboard] useLayoutEffect running - checking authentication...');

    // Wait for session validation to complete
    if (sessionLoading) {
      console.log('[Dashboard] Session validation in progress...');
      return;
    }

    if (!sessionValid) {
      console.log('[Dashboard] Session validation failed, redirecting to login');
      return; // Hook will handle redirect
    }

    const token = sessionStorage.getItem('authToken');
    const user = getStoredUser();
    console.log('[Dashboard] Token from sessionStorage:', token ? `exists (${token.substring(0, 20)}...)` : 'missing');
    console.log('[Dashboard] User from sessionStorage:', user ? `${user.username}` : 'missing');

    if (token && user) {
      console.log('[Dashboard] Valid session found, setting authToken and isReady to true');
      setAuthToken(token);
      setIsReady(true);
    } else {
      console.log('[Dashboard] No valid session found, redirecting to login');
      window.location.replace('/login'); // Replace history to prevent forward navigation
    }
  }, [sessionValid, sessionLoading, router]);

  // Security: Prevent BFCache from bypassing authentication
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is loaded from BFCache, re-verify authentication
      if (event.persisted) {
        console.log('[Dashboard] Page loaded from BFCache, re-verifying authentication...');
        if (!sessionValid || !validateSessionOwnership() || !isAuthenticated()) {
          console.log('[Dashboard] Auth failed after BFCache load, redirecting to login');
          removeToken();
          window.location.replace('/login');
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [sessionValid]);

  // Security: Check authentication on visibility change (user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!sessionValid || !validateSessionOwnership() || !isAuthenticated())) {
        console.log('[Dashboard] Auth check failed on visibility change, redirecting to login');
        removeToken();
        window.location.replace('/login');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionValid]);

  // Set body classes when authenticated
  useEffect(() => {
    if (!authToken) return;

    // Set dashboard active class
    document.body.classList.add('dashboard-active');
    document.body.classList.remove('form-active');

    return () => {
      document.body.classList.remove('dashboard-active');
    };
  }, [authToken]);

useEffect(() => {
    if (!authToken) return;

    // Check if mobile device
    const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);

    if (activeView === 'dashboard' && !isMobileDevice) {
      document.body.classList.add('dashboard-scroll-lock');
    } else {
      document.body.classList.remove('dashboard-scroll-lock');
    }

    return () => {
      document.body.classList.remove('dashboard-scroll-lock');
    };
  }, [authToken, activeView]);

  // Reset export status when sidebar is opened (if it was in 'exported' state)
  useEffect(() => {
    if (sidebarOpen && exportStatus === 'exported') {
      setExportStatus('idle');
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = null;
      }
      console.log('[Dashboard] Export status reset when sidebar opened');
    }
  }, [sidebarOpen, exportStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear export timeout on component unmount
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const user = getCurrentUser();
    // For regular clients, the JWT subject (sub) IS the client_id.
    // For admins, it might be user_id, but this dashboard page is primarily for clients.
    // If user.client_id is undefined, fallback to user.sub.
    const clientId = user?.client_id || user?.sub;

    if (clientId) {
      console.log('[Dashboard] Connecting to socket for client:', clientId);
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit('join', { client_id: clientId });
      
      const handleUpdates = (data: any) => {
        console.log('[Dashboard] Received target update event:', data);
        // Reload targets and metrics
        loadTargetsData();
        reloadMetricsWithTargets();
      };
      
      socket.on('targets_updated', handleUpdates);
      
      return () => {
        console.log('[Dashboard] Cleaning up socket listeners');
        socket.off('targets_updated', handleUpdates);
      };
    } else {
      console.warn('[Dashboard] Could not determine client ID for socket connection', user);
    }
  }, [authToken]);

  // Load dashboard summary (metrics + targets + charts + client name)
  useEffect(() => {
    if (!isReady || !authToken) return;

    let cancelled = false;
    setChartsPrefetched(false);

    const loadDashboardSummary = async () => {
      setLoading(true);
      setMetricsLoaded(false);
      setTargetsLoaded(false);

      try {
        const response = await fetch(buildApiUrl('/api/dashboard/summary'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard summary');
        }

        const data = await response.json();
        if (!isMountedRef.current || cancelled) return;

        if (data.client_name) {
          setClientName(data.client_name);
        } else {
          setClientName('Client');
        }

        const metricsPayload = data.metrics || {};
        const targetsPayload = data.targets || {};
        const nextMetrics = buildMetricsState(metricsPayload, targetsPayload);
        setMetricsData(nextMetrics);
        setMetricsLoaded(true);
        setTargetsLoaded(true);

        const normalizedIncome = normalizeChartData(data.charts?.income, 'income');
        const normalizedExpense = normalizeChartData(data.charts?.expense, 'expense');
        
        console.log('Dashboard: Chart data from API', {
          rawIncomeData: data.charts?.income,
          rawExpenseData: data.charts?.expense,
          normalizedIncome: normalizedIncome,
          normalizedExpense: normalizedExpense
        });
        
        setChartDataCache({
          income: normalizedIncome ?? null,
          expense: normalizedExpense ?? null
        });
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Error loading dashboard summary:', error);
        }
      } finally {
        if (isMountedRef.current && !cancelled) {
          setLoading(false);
          setChartsPrefetched(true);
        }
      }
    };

    loadDashboardSummary();

    return () => {
      cancelled = true;
    };
  }, [isReady, authToken]);

  // Handle initial load completion
  useEffect(() => {
    if (!loading && Object.keys(metricsData).length > 0 && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 50); // Very short delay just to ensure data is loaded
      return () => clearTimeout(timer);
    }
  }, [loading, metricsData, isInitialLoad]);

  // Load target information for all metrics
  const loadTargetsForMetrics = async () => {
    if (!authToken || !isMountedRef.current) return;

    try {
      const response = await fetch(buildApiUrl('/api/targets'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const targets = data.targets || {};
        applyTargetsToMetrics(targets);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading targets:', error);
      }
    }
  };

  // Format value based on type
  const formatValue = (value: any, isRatio: boolean) => {
    if (value === null || value === undefined) return '-';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';

    if (isRatio) {
      // For Future Planning Ratios, show decimal values instead of percentages
      return numValue.toFixed(2);
    }

    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? '-' : '';

    if (absValue >= 1000000000) return `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(1)}K`;
    return `${sign}$${absValue.toFixed(0)}`;
  };

  // Handle logout
  const handleLogout = () => {
    console.log('[Dashboard] Logout initiated, clearing session and replacing history');
    removeToken(); // Use session-aware logout
    setAuthToken(null);
    setCachedInsights(null);
    setHasGeneratedInsights(false);
    setMetricsData({});
    setChartDataCache({ income: null, expense: null });
    setSidebarOpen(false);
    // Use replace to prevent forward button from working
    window.location.replace('/login');
  };

  // Generate AI insights
  const generateInsights = async () => {
    if (!authToken) return;

    // If we already have cached insights, just show the slide-up window
    if (hasGeneratedInsights && cachedInsights) {
      setInsightsContent(cachedInsights);
      setInsightsOverlayOpen(true);
      setTimeout(() => setInsightsSlideUp(true), 50);
      return;
    }

    // Show loading state and open overlay immediately
    setInsightsLoading(true);
    setInsightsContent('');
    setInsightsOverlayOpen(true);
    setTimeout(() => setInsightsSlideUp(true), 50);

    try {
      // Collect all cached metrics
      const metricsDataForAI: Record<string, Record<string, any>> = {};
      Object.keys(metricsData).forEach(metricName => {
        const metric = metrics.find(m => m?.name === metricName);
        if (metric) {
          const backendMetricName = metricName.replace(/-/g, '_');
          const categoryKey = metric.category === 'assets' ? 'assets_and_liabilities' :
            metric.category === 'income' ? 'income_analysis' :
              metric.category === 'expenses' ? 'expense_tracking' :
                metric.category === 'insurance' ? 'insurance_coverage' :
                  'future_planning_ratios';

          if (!metricsDataForAI[categoryKey]) {
            metricsDataForAI[categoryKey] = {};
          }
          metricsDataForAI[categoryKey][backendMetricName] = metricsData[metricName].value;
        }
      });

      const requestBody: any = {
        include_summary: false,
        stream: true
      };

      if (Object.keys(metricsDataForAI).length > 0) {
        requestBody.metrics_data = metricsDataForAI;
      }

      const response = await fetch(buildApiUrl('/api/insights/generate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response (fallback for errors or non-streaming backend)
        const responseText = await response.text();
        let data: any = {};
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          data = { message: responseText };
        }

        if (!response.ok) {
           throw new Error(
            data?.error ||
            data?.message ||
            (typeof data === 'string' ? data : '') ||
            responseText ||
            'Failed to generate insights'
          );
        }
        
        if (data.insights) {
            setInsightsContent(data.insights);
            setCachedInsights(data.insights);
            setHasGeneratedInsights(true);
        } else {
            throw new Error('No insights returned from server');
        }

      } else {
        // Handle Streaming response
        if (!response.ok) {
            const text = await response.text();
             throw new Error(text || 'Failed to generate insights');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
            throw new Error('Response body is not readable');
        }
        
        let accumulatedContent = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;
            setInsightsContent(accumulatedContent);
        }

        setCachedInsights(accumulatedContent);
        setHasGeneratedInsights(true);
      }

    } catch (error: any) {
      console.error('Error generating insights:', error);
      setInsightsContent(`Error: ${error.message || 'Unable to generate insights at this time. Please try again later.'}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Close insights with slide-down animation
  const closeInsights = () => {
    setInsightsSlideUp(false);
    setTimeout(() => {
      setInsightsOverlayOpen(false);
    }, 300); // Match the slide-down animation duration
  };

  const buttonVisible = !insightsOverlayOpen;


  // Handle chart data updates from child components
  const handleChartDataUpdate = (chartType: 'income' | 'expense', data: any[]) => {
    setChartDataCache(prev => ({
      ...prev,
      [chartType]: data
    }));
  };

  // Profile view
  const handleViewProfile = () => {
    setSidebarOpen(false);
    setActiveView('profile');
    loadProfileData();
  };

  const loadProfileData = async () => {
    if (!authToken) return;

    setProfileLoading(true);
    setProfileError(false);

    try {
      const response = await fetch(buildApiUrl('/api/profile'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
      } else if (response.status === 401) {
        handleLogout();
      } else {
        throw new Error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileError(true);
    } finally {
      setProfileLoading(false);
    }
  };

  // Contact Advisor view
  const handleContactAdvisor = () => {
    setSidebarOpen(false);
    setActiveView('advisor');
  };

  // Targets view
  const handleManageTargets = () => {
    setSidebarOpen(false);
    setActiveView('targets');
    loadTargetsData();
  };

  const handleCloseResetConfirmation = () => {
    setResetConfirmationClosing(true);
    setTimeout(() => {
      setShowResetConfirmation(false);
      setResetConfirmationClosing(false);
    }, 400); // Match animation duration
  };

  const loadTargetsData = async () => {
    if (!authToken) return;

    setTargetsLoading(true);
    setTargetsError(false);

    try {
      const response = await fetch(buildApiUrl('/api/targets'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const targets = data.targets || {};
        setTargetsData(targets);
        setOriginalTargetsData({ ...targets });
      } else if (response.status === 401) {
        handleLogout();
      } else {
        throw new Error('Failed to load targets');
      }
    } catch (error) {
      console.error('Error loading targets:', error);
      setTargetsError(true);
    } finally {
      setTargetsLoading(false);
    }
  };

  const saveTargets = async () => {
    if (!authToken) return;

    setSaveTargetsLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/targets'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: targetsData
        })
      });

      if (response.ok) {
        setOriginalTargetsData({ ...targetsData });

        // Reload metrics to get updated target data
        await reloadMetricsWithTargets();

        // Show success state
        setSaveTargetsLoading(false);
        setSaveTargetsSuccess(true);

        // Reset success state after 1 second
        setTimeout(() => {
          setSaveTargetsSuccess(false);
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save targets');
      }
    } catch (error) {
      console.error('Error saving targets:', error);
      setSaveTargetsLoading(false);
    }
  };

  const reloadMetricsWithTargets = async () => {
    if (!authToken) return;
    await loadTargetsForMetrics();
  };

  const handleResetAllTargets = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetTargets = async () => {
    setShowResetConfirmation(false);
    setResetTargetsLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/targets'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setTargetsData({});
        setOriginalTargetsData({});

        // Reload metrics
        await reloadMetricsWithTargets();

        // Show success state
        setResetTargetsLoading(false);
        setResetTargetsSuccess(true);

        // Reset success state after 1 second
        setTimeout(() => {
          setResetTargetsSuccess(false);
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset targets');
      }
    } catch (error) {
      console.error('Error resetting targets:', error);
      setResetTargetsLoading(false);
    }
  };

  const discardTargetChanges = () => {
    setTargetsData({ ...originalTargetsData });
  };

  const updateTargetValue = (metricName: string, value: string) => {
    const numValue = parseFloat(value);
    if (value && !isNaN(numValue)) {
      setTargetsData(prev => ({
        ...prev,
        [metricName]: numValue
      }));
    } else {
      const newData = { ...targetsData };
      delete newData[metricName];
      setTargetsData(newData);
    }
  };

  const deleteIndividualTarget = async (metricName: string) => {
    if (!authToken) return;

    try {
      // Convert metric name from hyphenated to underscore format for backend
      const backendMetricName = metricName.replace(/-/g, '_');

      const response = await fetch(buildApiUrl(`/api/targets/${backendMetricName}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Reload targets data from server to get the previous target (if any)
        await loadTargetsData();

        // Reload metrics to update target indicators
        await reloadMetricsWithTargets();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete target');
      }
    } catch (error) {
      console.error('Error deleting target:', error);
      alert('Failed to delete target. Please try again.');
    }
  };

  const getTargetStatusHTML = (actualValue: number | null | undefined, targetValue: number | null | undefined) => {
    if (!targetValue || !actualValue) {
      return '<span class="status-no-target">No target</span>';
    }

    const percentage = ((actualValue / targetValue - 1) * 100).toFixed(1);

    if (actualValue > targetValue) {
      return `<span class="status-above text-green-600">↑ ${Math.abs(parseFloat(percentage))}%</span>`;
    } else if (actualValue < targetValue) {
      return `<span class="status-below text-red-600">↓ ${Math.abs(parseFloat(percentage))}%</span>`;
    } else {
      return `<span class="status-equal text-blue-600">✓ On Target</span>`;
    }
  };

  // Metric Detail Modal Functions
  const handleMetricCardClick = (metricName: string, category: string) => {
    setSelectedMetricName(metricName);
    setSelectedCategoryName(category);
    setMetricDetailModalOpen(true);
  };

  const handleCloseMetricDetailModal = () => {
    setMetricDetailModalOpen(false);
    setSelectedMetricName('');
    setSelectedCategoryName('');
  };

  // Account History view
  const handleViewAccountHistory = () => {
    setSidebarOpen(false);
    setActiveView('account-history');
  };

// Visualizations view
  const handleViewVisualizations = () => {
    setSidebarOpen(false);
    setActiveView('visualizations');
  };

  // AI Insights view
  const handleViewAIInsights = () => {
    setSidebarOpen(false);
    setActiveView('ai-insights');
    // Just navigate to the AI insights page without auto-generating
    // User will need to click the "Generate Insights" button manually
  };

  const handleShowDashboard = () => {
    setSidebarOpen(false);
    setActiveView('dashboard');
  };

  // Export Data Functions
  const handleExportData = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!authToken) return;

    try {
      if (Object.keys(metricsData).length === 0) {
        throw new Error('No data available for export. Please wait for the dashboard to load.');
      }

      // Set export status to 'exporting' to change button appearance
      setExportStatus('exporting');
      console.log('[Dashboard] Export status set to exporting');

      // Use backend export endpoint (supports styling/formatting)
      const response = await fetch(buildApiUrl('/api/export-data'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to export data');
      }

      const blob = await response.blob();

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `wisdom_index_financial_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark complete and close sidebar
      setExportStatus('exported');
      console.log('[Dashboard] Export status set to exported');
      setSidebarOpen(false);

      // Clear any existing timeout
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
      }

      // Reset export status after 3 seconds to return button to normal
      exportTimeoutRef.current = setTimeout(() => {
        setExportStatus('idle');
        console.log('[Dashboard] Export status reset to idle after 3 seconds');
        exportTimeoutRef.current = null;
      }, 3000);

    } catch (error: any) {
      console.error('Export error:', error);
      setExportStatus('idle'); // Reset button state on error

      // Clear any existing timeout on error
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = null;
      }

      alert(error.message || 'Failed to export data');
    }
  };

  const createMetricsSheet = (wb: any) => {
    const metricsDataArray = [
      ['Wisdom Index Financial Export'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Assets & Liabilities'],
      ['Metric', 'Value'],
      ['Net Worth', formatMetricForExport('net-worth')],
      ['Portfolio Value', formatMetricForExport('portfolio-value')],
      ['Real Estate Value', formatMetricForExport('real-estate-value')],
      ['Debt', formatMetricForExport('debt')],
      ['Equity', formatMetricForExport('equity')],
      ['Fixed Income', formatMetricForExport('fixed-income')],
      ['Cash', formatMetricForExport('cash')],
      [],
      ['Income Analysis'],
      ['Metric', 'Value'],
      ['Earned Income', formatMetricForExport('earned-income')],
      ['Social Security Income', formatMetricForExport('social-security-income')],
      ['Pension Income', formatMetricForExport('pension-income')],
      ['Real Estate Income', formatMetricForExport('real-estate-income')],
      ['Business Income', formatMetricForExport('business-income')],
      ['Total Income', formatMetricForExport('total-income')],
      [],
      ['Expense Tracking'],
      ['Metric', 'Value'],
      ['Current Year Giving', formatMetricForExport('current-year-giving')],
      ['Current Year Savings', formatMetricForExport('current-year-savings')],
      ['Current Year Debt', formatMetricForExport('current-year-debt')],
      ['Current Year Taxes', formatMetricForExport('current-year-taxes')],
      ['Current Year Living Expenses', formatMetricForExport('current-year-living-expenses')],
      ['Total Expenses', formatMetricForExport('total-expenses')],
      ['Margin', formatMetricForExport('margin')],
      [],
      ['Insurance Coverage'],
      ['Metric', 'Value'],
      ['Life Insurance', formatMetricForExport('life-insurance')],
      ['Disability', formatMetricForExport('disability')],
      ['LTC', formatMetricForExport('ltc')],
      ['Umbrella', formatMetricForExport('umbrella')],
      ['Business Insurance', formatMetricForExport('business-insurance')],
      ['Flood Insurance', formatMetricForExport('flood-insurance')],
      ['At Risk', formatMetricForExport('at-risk')],
      [],
      ['Future Planning Ratios'],
      ['Metric', 'Value'],
      ['Retirement Ratio', formatMetricForExport('retirement-ratio')],
      ['Survivor Ratio', formatMetricForExport('survivor-ratio')],
      ['Education Ratio', formatMetricForExport('education-ratio')],
      ['New Cars Ratio', formatMetricForExport('new-cars-ratio')],
      ['LTC Ratio', formatMetricForExport('ltc-ratio')],
      ['LTD Ratio', formatMetricForExport('ltd-ratio')],
      [],
      ['Wisdom Index Ratios'],
      ['Metric', 'Value'],
      ['Savings Ratio', formatMetricForExport('savings-ratio')],
      ['Giving Ratio', formatMetricForExport('giving-ratio')],
      ['Reserves', formatMetricForExport('reserves-ratio')],
      ['Debt Ratio', formatMetricForExport('debt-ratio')],
      ['Diversification', formatMetricForExport('diversification-ratio')]
    ];

    const ws = XLSX.utils.aoa_to_sheet(metricsDataArray);
    ws['!cols'] = [
      { width: 30 },
      { width: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Financial Metrics");
  };

  const createChartSheet = (wb: any, chartData: any[], sheetName: string) => {
    const chartSheetData = [
      [sheetName],
      ['Category', 'Amount'],
      ...chartData.map(item => [item.category, item.amount])
    ];

    const ws = XLSX.utils.aoa_to_sheet(chartSheetData);

    // Set column widths
    ws['!cols'] = [
      { width: 25 },
      { width: 15 }
    ];

    // Apply cell formatting - right-align the "Amount" header (cell B1)
    if (!ws['!cellStyles']) ws['!cellStyles'] = {};

    // Style for the "Amount" header (B1) - right aligned
    ws['B1'].s = {
      alignment: {
        horizontal: 'right'
      },
      font: {
        bold: true
      }
    };

    // Style for the "Category" header (A1) - left aligned (default) but bold
    ws['A1'].s = {
      font: {
        bold: true
      }
    };

    // Also right-align all amount values in column B for consistency
    for (let i = 2; i <= chartData.length + 1; i++) {
      const cellRef = `B${i}`;
      if (ws[cellRef]) {
        ws[cellRef].s = {
          alignment: {
            horizontal: 'right'
          }
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  const formatMetricForExport = (metricName: string) => {
    const metric = metricsData[metricName];
    if (!metric || metric.value === null || metric.value === undefined) {
      return 0;
    }
    return parseFloat(metric.value) || 0;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResetConfirmation) handleCloseResetConfirmation();
        else if (insightsOverlayOpen) closeInsights();
        else if (metricDetailModalOpen) setMetricDetailModalOpen(false);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResetConfirmation, insightsOverlayOpen, metricDetailModalOpen, sidebarOpen, closeInsights]);

  // Show loading screen while detecting device or during initial load to prevent double loading screens
  if (!isDeviceDetected || (!metricsLoaded && !targetsLoaded)) {
    return <MobileLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <DashboardLayout
        clientName={clientName}
        metricsData={metricsData}
        loading={loading}
        metricsLoaded={metricsLoaded}
        targetsLoaded={targetsLoaded}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        handleMetricCardClick={handleMetricCardClick}
        authToken={authToken}
        onChartDataUpdate={handleChartDataUpdate}
        insightsOverlayOpen={insightsOverlayOpen}
        insightsSlideUp={insightsSlideUp}
        buttonVisible={buttonVisible}
        insightsLoading={insightsLoading}
        insightsContent={insightsContent}
        generateInsights={generateInsights}
        closeInsights={closeInsights}
        activeView={activeView}
        handleShowDashboard={handleShowDashboard}
        handleViewProfile={handleViewProfile}
        handleContactAdvisor={handleContactAdvisor}
        handleManageTargets={handleManageTargets}
        handleExportData={handleExportData}
handleViewAccountHistory={handleViewAccountHistory}
        handleViewVisualizations={handleViewVisualizations}
        handleViewAIInsights={handleViewAIInsights}
        exportStatus={exportStatus}
        profileLoading={profileLoading}
        profileData={profileData}
        profileError={profileError}
        loadProfileData={loadProfileData}
        onProfileUpdate={handleProfileUpdate}
        targetsLoading={targetsLoading}
        targetsError={targetsError}
        targetsData={targetsData}
        saveTargetsLoading={saveTargetsLoading}
        resetTargetsLoading={resetTargetsLoading}
        saveTargetsSuccess={saveTargetsSuccess}
        resetTargetsSuccess={resetTargetsSuccess}
        showResetConfirmation={showResetConfirmation}
        resetConfirmationClosing={resetConfirmationClosing}
        loadTargetsData={loadTargetsData}
        saveTargets={saveTargets}
        handleResetAllTargets={handleResetAllTargets}
        confirmResetTargets={confirmResetTargets}
        handleCloseResetConfirmation={handleCloseResetConfirmation}
        discardTargetChanges={discardTargetChanges}
        updateTargetValue={updateTargetValue}
        deleteIndividualTarget={deleteIndividualTarget}
        getTargetStatusHTML={getTargetStatusHTML}
        metricDetailModalOpen={metricDetailModalOpen}
        selectedMetricName={selectedMetricName}
        selectedCategoryName={selectedCategoryName}
        handleCloseMetricDetailModal={handleCloseMetricDetailModal}
        isInitialLoad={isInitialLoad}
        metricsByCategory={metricsByCategory}
        hasGeneratedInsights={hasGeneratedInsights}
initialIncomeChartData={chartDataCache.income}
        initialExpenseChartData={chartDataCache.expense}
        chartsPrefetched={chartsPrefetched}
      />

{/* Metric Detail Modal - Desktop Only */}
      {!isMobile && (
        <MetricDetailModal
          isOpen={metricDetailModalOpen}
          onClose={handleCloseMetricDetailModal}
          metricName={selectedMetricName}
          categoryName={selectedCategoryName}
        />
      )}
    </ErrorBoundary>
  );
}

