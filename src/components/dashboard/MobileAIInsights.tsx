'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileAIInsightsProps {
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

export const MobileAIInsights: React.FC<MobileAIInsightsProps> = ({
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
  const { isMobile } = useMobileDetection();
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content is being streamed
  useEffect(() => {
    if (insightsLoading && contentRef.current) {
      const scrollToBottom = () => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      };
      
      // Scroll immediately and then periodically during streaming
      scrollToBottom();
      const interval = setInterval(scrollToBottom, 100);
      
      return () => clearInterval(interval);
    }
  }, [insightsLoading, insightsContent]);

  // Format insights text with proper HTML structure (same as desktop version)
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

  // Only render on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col h-full">
      {/* AI Insights Header - Fixed */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-lg p-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Insights</h2>
            <p className="text-blue-100 text-sm">Personalized financial recommendations</p>
          </div>
        </div>
      </div>

      {/* Generate Insights Button - Fixed */}
      {!hasGeneratedInsights && (
        <div className="p-6 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateInsights}
            disabled={insightsLoading}
            className={`w-full py-5 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
              insightsLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-gray-300'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]'
            }`}
          >
            {insightsLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing your finances...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate AI Insights</span>
              </div>
            )}
          </motion.button>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-0 pb-6" ref={contentRef}>
        {/* Insights Content */}
        {insightsContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              
              <div className="p-6">
                <div className="text-gray-800 leading-relaxed prose prose-gray max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: formatInsightsText(insightsContent) }} />
                  {/* Cursor effect for streaming */}
                  {insightsLoading && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle"></span>
                  )}
                </div>

                
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Tips */}
        {!insightsContent && !insightsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💡</span>
                </div>
                <h4 className="font-bold text-blue-900 text-lg">Quick Tips</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-blue-800 font-medium">Review your spending patterns regularly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-blue-800 font-medium">Set realistic savings targets</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-blue-800 font-medium">Diversify your investment portfolio</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};