'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ClientDashboardView } from '@/types/dashboard';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleShowDashboard: () => void;
  handleViewProfile: () => void;
  handleContactAdvisor: () => void;
  handleManageTargets: () => void;
  handleExportData: (e: React.MouseEvent) => void;
  handleViewAccountHistory: () => void;
  handleViewVisualizations: () => void;
  exportStatus: 'idle' | 'exporting' | 'exported';
  clientName: string;
  activeView: ClientDashboardView;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  handleShowDashboard,
  handleViewProfile,
  handleContactAdvisor,
  handleManageTargets,
  handleExportData,
  handleViewAccountHistory,
  handleViewVisualizations,
  exportStatus,
  clientName,
  activeView
}) => {
  const [enableCollapsedAnimation, setEnableCollapsedAnimation] = useState(false);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    setEnableCollapsedAnimation(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setShouldShowOverlay(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems: Array<{
    id: string;
    label: string;
    icon: string;
    action: (e?: React.MouseEvent) => void;
    type: 'view' | 'action';
    special?: boolean;
  }> = [
      { id: 'dashboard', label: 'Dashboard', icon: 'M4 4h6v8H4V4zm10 0h6v4h-6V4zM4 14h6v6H4v-6zm10-4h6v10h-6V10z', action: () => handleShowDashboard(), type: 'view' },
      { id: 'visualizations', label: 'Visualizations', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M12.5 8.5v5H17v-1.5h-3v-3.5h-1.5z', action: () => handleViewVisualizations(), type: 'view' },
      { id: 'profile', label: 'View Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', action: () => handleViewProfile(), type: 'view' },
      { id: 'advisor', label: 'Contact Advisor', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', action: () => handleContactAdvisor(), type: 'view' },
      { id: 'targets', label: 'Manage Targets', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', action: () => handleManageTargets(), type: 'view' },
      { id: 'account-history', label: 'Account History', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', action: () => handleViewAccountHistory(), type: 'view' },
      { id: 'export', label: exportStatus === 'exported' ? 'Exported' : exportStatus === 'exporting' ? 'Exporting...' : 'Export Data', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3', action: (e?: React.MouseEvent) => handleExportData(e as React.MouseEvent), type: 'action', special: exportStatus !== 'idle' }
    ];

  const actionButtonClasses = (item: typeof navigationItems[number]) => {
    if (item.special) {
      return 'bg-green-600/80 text-white shadow-lg ring-1 ring-white/10';
    }
    if (item.type === 'view' && activeView === item.id) {
      return 'bg-blue-600/80 text-white shadow-lg ring-1 ring-white/10';
    }
    return 'text-blue-100 hover:bg-blue-800/60 hover:text-white hover:ring-1 hover:ring-white/10';
  };

  return (
    <>
      {/* Collapsed Icon Strip */}
      {!sidebarOpen && (
        <motion.div
          initial={enableCollapsedAnimation ? { x: -40, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl z-40 flex flex-col items-center py-6 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSidebarOpen(true);
              // Emit custom event for chart components to listen to
              window.dispatchEvent(new CustomEvent('sidebarToggle'));
            }}
            aria-label="Open sidebar"
            className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <div className="w-10 h-px bg-white/20 mt-2" />

          <div className="flex-1 flex flex-col items-center gap-4 py-4">
            {navigationItems.map((item, index) => (
              <motion.button
                key={`${item.id}-collapsed`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => item.action(e)}
                aria-label={item.label}
                title={item.label}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-blue-100 transition ${item.special ? 'bg-green-600/80 text-white' : activeView === item.id ? 'bg-blue-600/80 text-white' : 'bg-white/5 hover:bg-white/15 hover:text-white'}`}
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

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && shouldShowOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[45]"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Animated Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              type: "tween",
              ease: "easeInOut",
              duration: 0.3
            }}
            className="fixed left-0 top-0 h-full w-48 sm:w-52 md:w-56 lg:w-60 xl:w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl flex flex-col z-[55] overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            {/* Sidebar Header with Username - Glassmorphism effect */}
            <div className="p-6 border-b border-blue-700/50 bg-blue-900/30 backdrop-blur-sm">
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
                <p className="text-sm font-semibold text-white drop-shadow-lg">{clientName}</p>
                <p className="text-xs text-blue-200/80 font-medium">Client</p>
              </motion.div>
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
                      onClick={(e) => item.action(e)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${actionButtonClasses(item)}`}
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
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
