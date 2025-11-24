'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, AlertCircle, TrendingUp, Target, Shield, Search, ChevronDown, Users } from 'lucide-react';
import { buildApiUrl } from '@/lib/api';
import { getAuthToken } from '@/utils/sessionAuth';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  has_account: boolean;
  last_login?: string;
  metrics?: {
    net_worth: number;
    portfolio_value: number;
    total_income: number;
    total_expenses: number;
    margin: number;
  };
}

interface AdminAIInsightsProps {
  onBack: () => void;
}

export function AdminAIInsights({ onBack }: AdminAIInsightsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  // Cache for insights per client to avoid regenerating during the same session
  const [clientInsightsCache, setClientInsightsCache] = useState<Map<number, { insights: string; summary: string }>>(new Map());
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadClients();
    // Load cached insights from sessionStorage on component mount
    loadCachedInsights();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCachedInsights = () => {
    try {
      const token = getAuthToken();
      if (!token) {
        // Clear any existing cache if no valid session
        sessionStorage.removeItem('adminInsightsCache');
        sessionStorage.removeItem('adminSessionId');
        sessionStorage.removeItem('adminCacheCleared');
        setClientInsightsCache(new Map());
        return;
      }

      // Always clear cache on page load - this ensures fresh start on refresh
      // Use performance.navigation to detect page refresh
      const isPageRefresh = performance.navigation && performance.navigation.type === 1;
      
      if (isPageRefresh) {
        // Page was refreshed - clear all cache
        console.log('Page refresh detected - clearing AI insights cache');
        sessionStorage.removeItem('adminInsightsCache');
        sessionStorage.removeItem('adminSessionId');
        sessionStorage.removeItem('adminCacheCleared');
        setClientInsightsCache(new Map());
        return;
      }

      // Check if we've already set the cache cleared flag for this session
      const hasClearedCache = sessionStorage.getItem('adminCacheCleared');
      if (!hasClearedCache) {
        // First load of this session - clear cache and set flag
        console.log('First session load - clearing AI insights cache');
        sessionStorage.removeItem('adminInsightsCache');
        sessionStorage.removeItem('adminSessionId');
        sessionStorage.setItem('adminCacheCleared', 'true');
        setClientInsightsCache(new Map());
        return;
      }

      // Try to load existing cache (should only work within same session, no refresh)
      const cachedData = sessionStorage.getItem('adminInsightsCache');
      if (!cachedData) {
        setClientInsightsCache(new Map());
        return;
      }

      console.log('Loading cached insights from sessionStorage');
      const parsedCache = JSON.parse(cachedData);
      const cacheMap = new Map<number, { insights: string; summary: string }>();
      Object.entries(parsedCache).forEach(([clientId, data]: [string, any]) => {
        cacheMap.set(parseInt(clientId), data);
      });
      setClientInsightsCache(cacheMap);
    } catch (error) {
      console.error('Error loading cached insights:', error);
      // Clear corrupted cache
      sessionStorage.removeItem('adminInsightsCache');
      sessionStorage.removeItem('adminSessionId');
      sessionStorage.removeItem('adminCacheCleared');
      setClientInsightsCache(new Map());
    }
  };

  const saveCachedInsights = (cache: Map<number, { insights: string; summary: string }>) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const cacheObject: Record<number, { insights: string; summary: string }> = {};
      cache.forEach((data, clientId) => {
        cacheObject[clientId] = data;
      });
      
      sessionStorage.setItem('adminInsightsCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving cached insights:', error);
    }
  };

  const loadClients = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }
      
      const apiUrl = buildApiUrl('/api/admin/clients-summary');
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError('Failed to load clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.client_id.toString().includes(searchLower)
    );
  });

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setError('');
    
    // Load insights from cache if available for this client
    if (clientInsightsCache.has(client.client_id)) {
      const cachedData = clientInsightsCache.get(client.client_id)!;
      setInsights(cachedData.insights);
      setSummary(cachedData.summary);
    } else {
      setInsights('');
      setSummary('');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownOpen(true);
  };

  const displayText = selectedClient
    ? `${selectedClient.first_name} ${selectedClient.last_name}`
    : searchTerm || 'Choose a client to generate insights for';

  const generateInsights = async () => {
    if (!selectedClient) return;

    // Check if we already have insights for this client in cache
    if (clientInsightsCache.has(selectedClient.client_id)) {
      const cachedData = clientInsightsCache.get(selectedClient.client_id)!;
      setInsights(cachedData.insights);
      setSummary(cachedData.summary);
      return;
    }

    setIsGeneratingInsights(true);
    setError('');
    setInsights('');
    setSummary('');

    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication token not found');
        setIsGeneratingInsights(false);
        return;
      }
      
      const apiUrl = buildApiUrl(`/api/admin/client/${selectedClient.client_id}/insights/generate`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          include_summary: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newInsights = data.insights || '';
        const newSummary = data.summary || '';
        
        setInsights(newInsights);
        setSummary(newSummary);
        
        // Cache the insights for this client to avoid regenerating during the session
        setClientInsightsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(selectedClient.client_id, { insights: newInsights, summary: newSummary });
          // Save to sessionStorage for persistence across navigation
          saveCachedInsights(newCache);
          return newCache;
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to generate insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate insights');
    } finally {
      setIsGeneratingInsights(false);
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

  // Format insights text with proper HTML structure (same as client-side)
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
            htmlContent += '<ul class="insights-bullets list-disc pl-6 mb-4" style="list-style-color: rgb(34 197 94);">';
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">AI Insights</h2>
            <p className="text-blue-100 text-sm">Generate AI-powered financial insights for clients</p>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </div>
      </div>

      {/* Client Selection */}
      <Card className="p-4 bg-white border border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Select Client</h3>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <div
              className="w-full max-w-md flex items-center justify-between px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(true);
                  }}
                  placeholder={displayText}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-xs"
                />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full max-w-md mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="px-2.5 py-3 text-xs text-gray-500 text-center">
                    No clients found matching "{searchTerm}"
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.client_id}
                      onClick={() => handleClientSelect(client)}
                      className="px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-xs">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {client.client_id} • {client.email}
                          </div>
                        </div>
                        <Badge
                          variant={client.has_account ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {client.has_account ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Client ID:</span>
                  <span className="text-xs font-medium">{selectedClient.client_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Email:</span>
                  <span className="text-xs font-medium">{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Account:</span>
                  <Badge variant={selectedClient.has_account ? "default" : "secondary"} className="text-xs">
                    {selectedClient.has_account ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {selectedClient.metrics && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Net Worth:</span>
                      <div className="font-medium">{formatCurrency(selectedClient.metrics.net_worth)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Portfolio:</span>
                      <div className="font-medium">{formatCurrency(selectedClient.metrics.portfolio_value)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Income:</span>
                      <div className="font-medium">{formatCurrency(selectedClient.metrics.total_income)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Expenses:</span>
                      <div className="font-medium">{formatCurrency(selectedClient.metrics.total_expenses)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Margin:</span>
                      <div className="font-medium">{formatCurrency(selectedClient.metrics.margin)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={generateInsights}
            disabled={!selectedClient || isGeneratingInsights}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 text-xs"
          >
            {isGeneratingInsights ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating Insights...
              </>
            ) : insights && selectedClient && clientInsightsCache.has(selectedClient.client_id) ? (
              <>
                <Brain className="w-3.5 h-3.5" />
                View Insights
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                Generate AI Insights
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Financial Summary */}
      {summary && (
        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="text-base font-semibold text-gray-900">Financial Summary</h3>
          </div>
          <div
            className="text-gray-800 leading-relaxed prose prose-gray max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: formatInsightsText(summary) }}
          />
        </Card>
      )}

      {/* AI Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-4 bg-white border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">AI Financial Insights</h3>
              <Badge variant="secondary" className="text-xs">
                Generated for {selectedClient?.first_name} {selectedClient?.last_name}
              </Badge>
            </div>
            <div
              className="text-gray-800 leading-relaxed prose prose-gray max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: formatInsightsText(insights) }}
            />
          </Card>
        </motion.div>
      )}
    </div>
  );
}