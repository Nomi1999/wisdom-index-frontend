'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  clientName: string;
  setSidebarOpen: (open: boolean) => void;
  isInitialLoad: boolean;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  clientName,
  setSidebarOpen,
  isInitialLoad,
  sidebarOpen
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-900/90 shadow-2xl sticky top-0 z-30 backdrop-blur-md border-b border-blue-700/30">
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
                {clientName}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
