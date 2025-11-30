'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileHeaderProps {
  clientName: string;
  onMenuClick: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  clientName,
  onMenuClick,
  onNotificationsClick,
  notificationCount = 0
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Check if category is open by monitoring body class
  React.useEffect(() => {
    const checkCategoryOpen = () => {
      setIsCategoryOpen(document.body.classList.contains('category-open'));
    };

    checkCategoryOpen();
    
    // Watch for class changes
    const observer = new MutationObserver(() => {
      checkCategoryOpen();
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render header when category is open on mobile
  if (isCategoryOpen) return null;

  return (
    <header className="bg-gradient-to-r from-blue-950 to-blue-900 shadow-lg sticky top-0 z-40 backdrop-blur-md">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title (centered on mobile) */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/images/White-logo-removebg-preview.png"
              alt="Wisdom Index"
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">
                Dashboard
              </h1>
              <p className="text-blue-200 text-xs">
                {clientName}
              </p>
            </div>
          </div>

          {/* Right: Profile/Notifications */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {onNotificationsClick && (
              <button
                onClick={onNotificationsClick}
                className="relative p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 active:bg-white/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Avatar */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 active:scale-95 transition-all duration-200"
            >
              {getInitials(clientName)}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Menu Overlay */}
      <AnimatePresence>
        {showProfileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 right-4 bg-white rounded-xl shadow-2xl p-2 min-w-[200px] z-50"
            >
              <div className="border-b border-gray-100 pb-2 mb-2">
                <div className="px-3 py-2">
                  <div className="font-semibold text-gray-900">{clientName}</div>
                  <div className="text-sm text-gray-500">Client</div>
                </div>
              </div>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Profile Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                Account Preferences
              </button>
              <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

// Wrapper component that switches between mobile and desktop headers
interface ResponsiveHeaderProps {
  clientName: string;
  setSidebarOpen: (open: boolean) => void;
  isInitialLoad: boolean;
  sidebarOpen: boolean;
  onNotificationsClick?: () => void;
  notificationCount?: number;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = (props) => {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <MobileHeader
        clientName={props.clientName}
        onMenuClick={() => {}} // No-op since we removed hamburger menu
        onNotificationsClick={props.onNotificationsClick}
        notificationCount={props.notificationCount}
      />
    );
  }

  // Return the original desktop header
  return (
    <header className="bg-gradient-to-r from-blue-950/90 via-blue-900/90 to-blue-950/90 shadow-2xl sticky top-0 z-30 backdrop-blur-md border-b border-blue-800/30">
      <div className="pl-2 pr-6 py-4 transition-all duration-300">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="flex items-center justify-between"
        >
          {/* Logo and Title */}
          <div className="flex items-center gap-4 flex-1">
            <motion.img
              whileHover={{ scale: 1.05, rotate: 5 }}
              src="/assets/images/White-logo-removebg-preview.png"
              alt="Wisdom Index Logo"
              className="h-10 w-auto drop-shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                Client Dashboard
              </h1>
              <p className="text-blue-100/80 text-sm font-medium drop-shadow">
                Wisdom Index Financial Advisory
              </p>
            </div>
          </div>

          {/* Client Name Display */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div id="client-name-display" className="text-white font-semibold text-sm">
                {props.clientName}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default ResponsiveHeader;