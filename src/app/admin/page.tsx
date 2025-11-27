'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientManagement } from '@/components/admin/ClientManagement';
import { DatabaseViewer } from '@/components/admin/DatabaseViewer';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { SecuritySettings } from '@/components/admin/SecuritySettings';
import { SettingsOverview } from '@/components/admin/SettingsOverview';
import { UserPermissions } from '@/components/admin/UserPermissions';
import { AdminAIInsights } from '@/components/admin/AdminAIInsights';
import { User, isSuperuser, validateSessionOwnership, getStoredUser, removeToken, getToken } from '@/utils/sessionAuth';
import { useSessionAuth } from '@/hooks/useSessionAuth';
import { motion, AnimatePresence } from 'framer-motion';
import AIConfiguration from '@/components/admin/AIConfiguration';
import { AdminVisualizations } from '@/components/admin/AdminVisualizations';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('clients');
  const [activeSettingsView, setActiveSettingsView] = useState<'overview' | 'security' | 'permissions' | 'ai-config'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const collapsedSidebarWidth = '4rem';

  // Use session auth hook for validation
  const { isValid: sessionValid, isLoading: sessionLoading } = useSessionAuth({
    onSessionInvalid: () => {
      console.log('[Admin Dashboard] Session validation failed, redirecting to login');
      window.location.href = '/login';
    },
    validateOnMount: true,
    validateOnVisibilityChange: true,
    validateOnFocus: true
  });

  useEffect(() => {
    console.log('[Admin Dashboard] Component mounting...');

    // Wait for session validation to complete
    if (sessionLoading) {
      console.log('[Admin Dashboard] Session validation in progress...');
      return;
    }

    if (!sessionValid) {
      console.log('[Admin Dashboard] Session validation failed, redirecting to login');
      return; // Hook will handle redirect
    }

    // Load admin-specific data from sessionStorage
    const user = getStoredUser();
    console.log('[Admin Dashboard] User from sessionStorage:', user);
    if (user) {
      console.log('[Admin Dashboard] Parsed user:', user);
      setAdminData(user);
    }
    setIsLoading(false);
  }, [sessionValid, sessionLoading]);

  const handleLogout = () => {
    // Use session-aware logout
    removeToken();
    window.location.href = '/login';
  };

  const handleNavigateToSecuritySettings = () => {
    setActiveSettingsView('security');
  };

  const handleNavigateToSettingsOverview = () => {
    setActiveSettingsView('overview');
  };

  const handleNavigateToUserPermissions = () => {
    setActiveSettingsView('permissions');
  };

  const handleNavigateToAIConfiguration = () => {
    setActiveSettingsView('ai-config');
  };

  const navigationItems = [
    { id: 'clients', label: 'Client Management', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m-9.644 0A3 3 0 012 18v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'visualizations', label: 'Visualizations', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M13.755 11V5a7.002 7.002 0 018.945 6H13.755z' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'database', label: 'Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'insights', label: 'AI Insights', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    ...(isSuperuser() ? [{ id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }] : [])
  ];

  const handleNavigationClick = (itemId: string) => {
    setActiveSection(itemId);
    setSidebarOpen(false);
    if (itemId !== 'settings') {
      setActiveSettingsView('overview');
    }
  };

  const getNavButtonClasses = (itemId: string) =>
    activeSection === itemId
      ? 'bg-blue-600/80 text-white shadow-lg ring-1 ring-white/10'
      : 'text-blue-100 hover:bg-blue-800/60 hover:text-white hover:ring-1 hover:ring-white/10';

  // Authorization is handled by the layout component

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex">
      {/* Floating Close Button When Sidebar Expanded */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed left-4 top-4 z-50 bg-blue-900/90 hover:bg-blue-800 text-white p-2 rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Collapsed Sidebar Strip */}
      {!sidebarOpen && (
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl z-40 flex flex-col items-center py-6 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <div className="w-10 h-px bg-white/20 mt-2" />

          <div className="flex-1 flex flex-col items-center gap-4 py-4">
            {navigationItems.map((item) => (
              <motion.button
                key={`${item.id}-collapsed`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigationClick(item.id)}
                aria-label={item.label}
                title={item.label}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${activeSection === item.id
                    ? 'bg-blue-600/80 text-white shadow-lg ring-1 ring-white/10'
                    : 'text-blue-100 bg-white/5 hover:bg-white/15 hover:text-white'
                  }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </motion.button>
            ))}
          </div>

          <div className="w-10 h-px bg-white/20" />
        </motion.div>
      )}

      {/* Animated Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl flex flex-col z-40 overflow-hidden"
          >
            {/* Sidebar Header with Username - Glassmorphism effect */}
            <div className="p-6 border-b border-blue-700/50 bg-blue-900/30 backdrop-blur-sm">
              {adminData && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 bg-blue-600/80 rounded-full flex items-center justify-center mx-auto mb-3 ring-2 ring-white/10 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </motion.div>
                  <p className="text-sm font-semibold text-white drop-shadow-lg">{adminData.username}</p>
                  <p className="text-xs text-blue-200/80 font-medium">
                    {adminData.isSuperuser ? 'Superuser Admin' : 'Administrator'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                {navigationItems.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: 0.1 + index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <motion.button
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigationClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${getNavButtonClasses(item.id)}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Fixed Logout Button at Bottom */}
            <div className="p-4 border-t border-blue-700/50 bg-gradient-to-b from-blue-800/60 to-blue-900/80 backdrop-blur-sm">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              >
                <Button
                  onClick={handleLogout}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 font-semibold transition-all duration-300 backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </Button>
              </motion.div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for main content when sidebar is open (Admin) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-30" // z-30 is lower than sidebar z-40
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area - Responsive margin */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'blur-sm' : ''}`}
        style={{ marginLeft: collapsedSidebarWidth, willChange: 'margin-left' }}
      >
        {/* Header with Logo - Glassmorphism effect */}
        <header className="bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-900/90 shadow-2xl sticky top-0 z-30 backdrop-blur-md border-b border-blue-700/30">
          <div className="pl-2 pr-6 py-4 transition-all duration-300">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="flex items-center gap-4"
            >
              <motion.img
                whileHover={{ scale: 1.05, rotate: 5 }}
                src="/assets/images/White-logo-removebg-preview.png"
                alt="Wisdom Index Logo"
                className="h-10 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                  Admin Dashboard
                </h1>
                <p className="text-blue-100/80 text-sm font-medium drop-shadow">
                  Wisdom Index Financial Advisory - Admin Panel
                </p>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {activeSection === 'clients' && <ClientManagement />}
                {activeSection === 'visualizations' && <AdminVisualizations authToken={getToken()} />}
                {activeSection === 'analytics' && <AdminAnalytics />}
                {activeSection === 'database' && <DatabaseViewer />}
                {activeSection === 'insights' && <AdminAIInsights onBack={() => setActiveSection('clients')} />}
                {activeSection === 'settings' && isSuperuser() && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSettingsView}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {activeSettingsView === 'overview' && (
                        <SettingsOverview
                          onNavigateToSecuritySettings={handleNavigateToSecuritySettings}
                          onNavigateToUserPermissions={handleNavigateToUserPermissions}
                          onNavigateToAIConfiguration={handleNavigateToAIConfiguration}
                        />
                      )}
                      {activeSettingsView === 'security' && (
                        <SecuritySettings onNavigateBack={handleNavigateToSettingsOverview} />
                      )}
                      {activeSettingsView === 'permissions' && (
                        <UserPermissions onNavigateBack={handleNavigateToSettingsOverview} />
                      )}
                      {activeSettingsView === 'ai-config' && (
                        <AIConfiguration onNavigateBack={handleNavigateToSettingsOverview} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
