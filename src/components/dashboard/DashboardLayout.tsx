'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './Sidebar';
import { MetricsGrid } from './MetricsGrid';
import { ChartsSection } from './ChartsSection';
import { AIInsights } from './AIInsights';
import { ProfilePanel } from './ProfilePanel';
import { ContactAdvisorPanel } from './ContactAdvisorPanel';
import { TargetsManager } from './TargetsManager';
import { AccountHistoryView } from './AccountHistoryView';
import { VisualizationsView } from './VisualizationsView';
import { ClientDashboardView } from '@/types/dashboard';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { MobileLoadingScreen } from './MobileLoadingScreen';
import { MobileDashboard } from './MobileDashboard';
import { MobileAIInsights } from './MobileAIInsights';
import { MobileChartsView } from './MobileChartsView';

interface DashboardLayoutProps {
  clientName: string;
  metricsData: Record<string, any>;
  loading: boolean;
  metricsLoaded: boolean;
  targetsLoaded: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleMetricCardClick: (metricName: string, category: string) => void;
  authToken: string | null;
  onChartDataUpdate: (chartType: 'income' | 'expense', data: any[]) => void;
  insightsOverlayOpen: boolean;
  insightsSlideUp: boolean;
  buttonVisible: boolean;
  insightsLoading: boolean;
  insightsContent: string;
  generateInsights: () => void;
  closeInsights: () => void;
  activeView: ClientDashboardView;
  handleShowDashboard: () => void;
  handleViewProfile: () => void;
  handleContactAdvisor: () => void;
  handleManageTargets: () => void;
  handleExportData: (e: React.MouseEvent) => void;
handleViewAccountHistory: () => void;
  handleViewVisualizations: () => void;
  handleViewAIInsights: () => void;
  exportStatus: 'idle' | 'exporting' | 'exported';
  profileLoading: boolean;
  profileData: any;
  profileError: boolean;
  loadProfileData: () => void;
  onProfileUpdate?: (updatedProfile: any) => void;
  targetsLoading: boolean;
  targetsError: boolean;
  targetsData: Record<string, number>;
  saveTargetsLoading: boolean;
  resetTargetsLoading: boolean;
  saveTargetsSuccess: boolean;
  resetTargetsSuccess: boolean;
  showResetConfirmation: boolean;
  resetConfirmationClosing: boolean;
  loadTargetsData: () => void;
  saveTargets: () => void;
  handleResetAllTargets: () => void;
  confirmResetTargets: () => void;
  handleCloseResetConfirmation: () => void;
  discardTargetChanges: () => void;
  updateTargetValue: (metricName: string, value: string) => void;
  deleteIndividualTarget: (metricName: string) => void;
  getTargetStatusHTML: (actualValue: number | null | undefined, targetValue: number | null | undefined) => string;
  metricDetailModalOpen: boolean;
  selectedMetricName: string;
  selectedCategoryName: string;
  handleCloseMetricDetailModal: () => void;
  isInitialLoad: boolean;
  metricsByCategory: Record<string, any[]>;
  hasGeneratedInsights: boolean;
initialIncomeChartData: any[] | null;
  initialExpenseChartData: any[] | null;
  chartsPrefetched: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  clientName,
  metricsData,
  loading,
  metricsLoaded,
  targetsLoaded,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  handleMetricCardClick,
  authToken,
  onChartDataUpdate,
  insightsOverlayOpen,
  insightsSlideUp,
  buttonVisible,
  insightsLoading,
  insightsContent,
  generateInsights,
  closeInsights,
  activeView,
  handleShowDashboard,
  handleViewProfile,
  handleContactAdvisor,
  handleManageTargets,
  handleExportData,
handleViewAccountHistory,
  handleViewVisualizations,
  handleViewAIInsights,
  exportStatus,
  profileLoading,
  profileData,
  profileError,
  loadProfileData,
  onProfileUpdate,
  targetsLoading,
  targetsError,
  targetsData,
  saveTargetsLoading,
  resetTargetsLoading,
  saveTargetsSuccess,
  resetTargetsSuccess,
  showResetConfirmation,
  resetConfirmationClosing,
  loadTargetsData,
  saveTargets,
  handleResetAllTargets,
  confirmResetTargets,
  handleCloseResetConfirmation,
  discardTargetChanges,
  updateTargetValue,
  deleteIndividualTarget,
  getTargetStatusHTML,
  metricDetailModalOpen,
  selectedMetricName,
  selectedCategoryName,
  handleCloseMetricDetailModal,
  isInitialLoad,
  metricsByCategory,
  hasGeneratedInsights,
initialIncomeChartData,
  initialExpenseChartData,
  chartsPrefetched
}) => {
  const { isMobile, isLoading } = useMobileDetection();
  const collapsedSidebarWidth = isMobile ? 0 : 64; // Hide sidebar on mobile
  const isDashboardView = activeView === 'dashboard';

  // Show loading screen while detecting device type
  if (isLoading) {
    return <MobileLoadingScreen />;
  }

const renderSecondaryView = () => {
    switch (activeView) {
      case 'profile':
        return (
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12">
            <ProfilePanel
              profileData={profileData}
              profileLoading={profileLoading}
              profileError={profileError}
              onRetry={loadProfileData}
              onProfileUpdate={onProfileUpdate}
            />
          </div>
        );
      case 'advisor':
        return (
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12">
            <ContactAdvisorPanel />
          </div>
        );
      case 'targets':
        return (
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12">
            <TargetsManager
              loading={targetsLoading}
              error={targetsError}
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
              updateTargetValue={updateTargetValue}
              deleteIndividualTarget={deleteIndividualTarget}
              getTargetStatusHTML={getTargetStatusHTML}
              metricsByCategory={metricsByCategory}
              metricsData={metricsData}
              discardChanges={discardTargetChanges}
            />
          </div>
        );
      case 'account-history':
        return (
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12">
            <AccountHistoryView authToken={authToken} />
          </div>
        );
case 'visualizations':
        return (
          <div className="w-full h-full flex flex-col">
            {isMobile ? (
              <MobileChartsView authToken={authToken} />
            ) : (
              <VisualizationsView authToken={authToken} />
            )}
          </div>
        );
      case 'ai-insights':
        return (
          <div className="w-full h-full flex flex-col">
            <MobileAIInsights
              insightsOverlayOpen={insightsOverlayOpen}
              insightsSlideUp={insightsSlideUp}
              buttonVisible={buttonVisible}
              insightsLoading={insightsLoading}
              insightsContent={insightsContent}
              generateInsights={generateInsights}
              closeInsights={closeInsights}
              isInitialLoad={isInitialLoad}
              hasGeneratedInsights={hasGeneratedInsights}
            />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div
      className={`${isMobile && isDashboardView ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'} flex ${isDashboardView ? (isMobile ? 'min-h-screen w-screen' : 'h-screen overflow-hidden') : 'min-h-screen w-full'
        }`}
      style={isMobile && isDashboardView ? { width: '100vw', maxWidth: '100vw', overflow: 'visible' } : {}}
    >
      {/* CSS to prevent flash of desktop UI on mobile */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .desktop-close-button {
            display: none !important;
          }
          .mobile-dashboard-container {
            width: 100vw !important;
            max-width: 100vw !important;
            min-width: 100vw !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            height: auto !important;
          }
          .mobile-dashboard-content {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 !important;
            overflow-y: auto !important;
            height: auto !important;
          }
          /* Reset any container constraints */
          .mobile-dashboard-container > * {
            max-width: none !important;
          }
          /* Ensure full viewport width but allow vertical scrolling */
          body {
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
          html {
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
      {/* Floating Close Button When Sidebar Expanded - Only show on desktop */}
      {!isMobile && sidebarOpen && (
        <button
          onClick={() => {
            setSidebarOpen(false);
            // Emit custom event for chart components to listen to
            window.dispatchEvent(new CustomEvent('sidebarToggle'));
          }}
          className="desktop-close-button fixed left-4 top-4 z-[70] bg-blue-900/90 hover:bg-blue-800 text-white p-2 rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Animated Sidebar - Only show on desktop */}
      {!isMobile && (
        <div className="desktop-sidebar">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            handleShowDashboard={handleShowDashboard}
            handleViewProfile={handleViewProfile}
            handleContactAdvisor={handleContactAdvisor}
            handleManageTargets={handleManageTargets}
            handleExportData={handleExportData}
            handleViewAccountHistory={handleViewAccountHistory}
            handleViewVisualizations={handleViewVisualizations}
            exportStatus={exportStatus}
            clientName={clientName}
            activeView={activeView}
          />
        </div>
      )}

      {/* Main Content Area - Responsive margin */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isDashboardView ? (isMobile ? 'min-h-screen' : 'h-full') : 'min-h-screen'
          } ${!isMobile && sidebarOpen ? 'blur-sm' : ''}`}
        style={{
          marginLeft: isMobile ? 0 : collapsedSidebarWidth,
          willChange: isMobile ? 'auto' : 'margin-left',
          width: isDashboardView ? (isMobile ? '100vw' : 'auto') : isMobile ? '100vw' : `calc(100vw - ${collapsedSidebarWidth}px)`,
          maxWidth: isMobile && isDashboardView ? '100vw' : 'none',
          minWidth: isMobile && isDashboardView ? '100vw' : 'auto',
          overflow: isMobile && isDashboardView ? 'visible' : 'auto',
          // Optimize for GPU acceleration during animation
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden' as const
        }}
      >
        {/* Header */}
        <ResponsiveHeader
          clientName={clientName}
          setSidebarOpen={setSidebarOpen}
          isInitialLoad={isInitialLoad}
          sidebarOpen={sidebarOpen}
        />

        {/* Main Content */}
<main
          className={`flex-1 ${activeView === 'visualizations' ? 'p-2' : (isMobile && isDashboardView ? 'p-0' : 'p-3 sm:p-4 lg:p-6')} flex flex-col ${isDashboardView ? (isMobile ? 'min-h-screen overflow-visible' : 'min-h-0 overflow-hidden') : 'min-h-[auto] overflow-visible'
            }`}
        >
<div className={`${isDashboardView ? 'flex' : 'hidden'} flex-1 min-h-0`}>
            {isMobile ? (
              // Mobile Dashboard View
              <div className="mobile-dashboard-content" style={{ width: '100%', maxWidth: '100%' }}>
                <MobileDashboard
                  metricsData={metricsData}
                  loading={loading}
                  metricsLoaded={metricsLoaded}
                  targetsLoaded={targetsLoaded}
                  handleMetricCardClick={handleMetricCardClick}
                />
              </div>
            ) : (
              // Desktop Dashboard View
              <div className={`grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-2 sm:gap-2 md:gap-3 lg:gap-4 w-full flex-1 min-h-0 ${isInitialLoad ? '' : ''}`}>
                <div className="min-h-0 overflow-hidden flex flex-col">
                  <MetricsGrid
                    metricsData={metricsData}
                    loading={loading}
                    metricsLoaded={metricsLoaded}
                    targetsLoaded={targetsLoaded}
                    handleMetricCardClick={handleMetricCardClick}
                    isInitialLoad={isInitialLoad}
                  />
                </div>

                <div className={`flex flex-col gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 min-h-0 pl-0 lg:pl-3 border-l-0 lg:border-l-2 border-gray-200 relative ${isInitialLoad ? '' : ''}`}>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ChartsSection
                      authToken={authToken}
                      onChartDataUpdate={onChartDataUpdate}
                      isInitialLoad={isInitialLoad}
                      initialIncomeData={initialIncomeChartData || undefined}
                      initialExpenseData={initialExpenseChartData || undefined}
                      prefetchComplete={chartsPrefetched}
                    />
                  </div>

                  <div className="flex-shrink-0">
                    <AIInsights
                      insightsOverlayOpen={insightsOverlayOpen}
                      insightsSlideUp={insightsSlideUp}
                      buttonVisible={buttonVisible}
                      insightsLoading={insightsLoading}
                      insightsContent={insightsContent}
                      generateInsights={generateInsights}
                      closeInsights={closeInsights}
                      isInitialLoad={isInitialLoad}
                      hasGeneratedInsights={hasGeneratedInsights}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isDashboardView && (
            <div className="w-full">
              {renderSecondaryView()}
            </div>
          )}
        </main>
      </div>
      {/* Metric Detail Modal */}
      {metricDetailModalOpen && (
        <div className={`fixed inset-0 flex items-center justify-center z-1000 opacity-100 visible transition-all duration-300`} onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseMetricDetailModal();
          }
        }}>
          <div className={`w-11/12 max-w-1100px max-h-90vh bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform scale-92 translate-y-5 opacity-0 border border-gray-200 backdrop-blur-lg active`}>
            <header className="flex justify-between items-center p-6 p-8 border-b border-gray-200 bg-white flex-shrink-0">
              <h1 className="m-0 text-gray-900 text-2xl font-semibold tracking-tight">Metric Details</h1>
              <button
                className="bg-none border-none text-gray-500 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                aria-label="Close"
                onClick={handleCloseMetricDetailModal}
              >
                <span>&times;</span>
              </button>
            </header>
            <main className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="flex flex-col items-center justify-center p-12 text-gray-600">
                <div className="w-10 h-10 border-3 border-gray-300 border-t-blue-900 rounded-full animate-spin mb-4"></div>
                <p>Loading metric details...</p>
              </div>
            </main>
            <footer className="p-4 p-8 border-t border-gray-200 bg-gray-50 text-right flex-shrink-0">
              <button className="bg-blue-900 text-white font-medium py-2.5 px-6 rounded-md border-none cursor-pointer transition-all duration-150 hover:bg-blue-1100" onClick={handleCloseMetricDetailModal}>Close</button>
            </footer>
          </div>
        </div>
      )}

{/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        onViewChange={(view) => {
          switch (view) {
            case 'dashboard':
              handleShowDashboard();
              break;
            case 'profile':
              handleViewProfile();
              break;
            case 'advisor':
              handleContactAdvisor();
              break;
            case 'targets':
              handleManageTargets();
              break;
            case 'account-history':
              handleViewAccountHistory();
              break;
            case 'visualizations':
              handleViewVisualizations();
              break;
            case 'ai-insights':
              handleViewAIInsights();
              break;
          }
        }}
        onLogout={handleLogout}
        onExportData={handleExportData}
        exportStatus={exportStatus}
        clientName={clientName}
      />
    </div>
  );
};
