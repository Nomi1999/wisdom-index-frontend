'use client';

import React from 'react';

interface AIInsightsProps {
  insightsOverlayOpen: boolean;
  insightsSlideUp: boolean;
  buttonVisible: boolean;
  insightsLoading: boolean;
  insightsContent: string;
  generateInsights: () => void;
  closeInsights: () => void;
  isInitialLoad: boolean;
  hasGeneratedInsights: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  insightsOverlayOpen,
  insightsSlideUp,
  buttonVisible,
  insightsLoading,
  insightsContent,
  generateInsights,
  closeInsights,
  isInitialLoad,
  hasGeneratedInsights
}) => {
  
  // Format insights text with proper HTML structure
  const formatInsightsText = (text: string) => {
    if (!text) return '';

    const sections = text.split(/\n\s*\n/);
    const formattedSections = sections.map(section => {
      section = section.trim();
      if (!section) return '';

      const lines = section.split(/\n/);
      let htmlContent = '';
      let isInBulletList = false;

      lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        // Check if this is a header (ends with colon and is one of our expected headers)
        if (line.endsWith(':') && (
          line.includes('Overall Financial Health Assessment') ||
          line.includes('Strengths in Your Financial Situation') ||
          line.includes('Areas Needing Improvement') ||
          line.includes('Specific Recommendations for Optimization') ||
          line.includes('Risk Considerations and Mitigation Strategies')
        )) {
          if (isInBulletList) {
            htmlContent += '</ul>';
            isInBulletList = false;
          }
          const cleanHeader = line.replace(/\*\*(.*?)\*\*/g, '$1');
          htmlContent += `<h5 class="insights-header font-bold text-lg mb-3 mt-4">${cleanHeader}</h5>`;
        } else if (line.match(/^[\-\*\+•]/) || line.match(/^\d+\./)) {
          if (!isInBulletList) {
            htmlContent += '<ul class="insights-bullets list-disc pl-6 mb-4">';
            isInBulletList = true;
          }
          let bulletText = line.replace(/^[\-\*\+•]\s*/, '');
          bulletText = bulletText.replace(/^\d+\.\s*/, '');
          bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
          bulletText = bulletText.replace(/\*(.*?)\*/g, '$1');
          bulletText = bulletText.replace(/`(.*?)`/g, '$1');
          htmlContent += `<li class="mb-2">${bulletText}</li>`;
        } else {
          if (isInBulletList) {
            htmlContent += '</ul>';
            isInBulletList = false;
          }
          let cleanText = line.replace(/\*\*(.*?)\*\*/g, '$1');
          cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
          cleanText = cleanText.replace(/`(.*?)`/g, '$1');
          htmlContent += `<p class="insights-text mb-3">${cleanText}</p>`;
        }
      });

      if (isInBulletList) {
        htmlContent += '</ul>';
      }

      return htmlContent;
    }).filter(section => section);

    return formattedSections.join('');
  };

  return (
    <>
      <section className="p-2 pb-3 flex-shrink-0" aria-labelledby="ai-insights-title">
        <div className="w-full relative">
          <button
            className={`bg-gradient-to-br from-blue-900 to-blue-800 text-white border-none p-3 lg:p-4 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-150 w-full relative overflow-hidden flex items-center justify-center gap-2 shadow-sm hover:from-blue-500 hover:to-blue-900 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed ${
              buttonVisible ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
            }`}
            onClick={generateInsights}
            disabled={insightsLoading || !buttonVisible}
            aria-hidden={!buttonVisible}
            tabIndex={buttonVisible ? 0 : -1}
          >
            {insightsLoading ? (
              <>
                <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                <span className="text-xs lg:text-sm">Generating AI Insights...</span>
              </>
            ) : (
              <span className="text-xs lg:text-sm">
                {hasGeneratedInsights ? 'View Insights' : 'Generate AI Insights'}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* AI Insights Overlay */}
      {insightsOverlayOpen && (
        <div
          data-insights-overlay="true"
          className={`absolute inset-0 z-50 transition-all duration-300 ${
                insightsSlideUp
                  ? 'bg-black/20 backdrop-blur-sm opacity-100 visible'
                  : 'bg-transparent opacity-0 invisible'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeInsights();
            }
          }}
        >
          <div
            className={`bg-white w-full shadow-2xl border border-gray-200 transform transition-all duration-400 ${
                insightsSlideUp ? 'translate-y-0' : 'translate-y-full'
            } absolute bottom-0 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] flex flex-col`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 border-b border-blue-600">
              <div className="flex justify-between items-center">
                <h2 className="m-0 text-white text-2xl font-bold tracking-tight">
                  AI Financial Insights
                </h2>
                <button
                  className="bg-white/20 hover:bg-white/30 text-white text-xl w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Close insights"
                  onClick={closeInsights}
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto bg-white flex-1">
              {insightsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="m-0 text-base font-medium text-gray-700">Generating insights...</p>
                </div>
              ) : insightsContent ? (
                <div className="text-gray-800 leading-relaxed prose prose-gray max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: formatInsightsText(insightsContent) }} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <p className="text-center text-lg">No insights available.</p>
                  <p className="text-center text-sm mt-2">Click the button above to generate AI-powered financial insights.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
