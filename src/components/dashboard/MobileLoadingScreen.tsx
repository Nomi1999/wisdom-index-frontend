'use client';

import React from 'react';

export const MobileLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 z-[9999] flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/assets/images/White-logo-removebg-preview.png"
            alt="Wisdom Index"
            className="h-16 w-auto mx-auto animate-pulse"
          />
        </div>
        
        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-white text-lg font-medium">Loading your dashboard...</p>
        <p className="text-blue-200 text-sm mt-2">Wisdom Index Financial Advisory</p>
      </div>
    </div>
  );
};

export default MobileLoadingScreen;