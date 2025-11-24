'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperuser, getAuthToken } from '@/utils/sessionAuth';
import { Loader2 } from 'lucide-react';

interface AIConfigurationProps {
  onNavigateBack?: () => void;
}

interface AIConfig {
  ai_base_url: string;
  ai_model: string;
  api_key_set: boolean;
}

export default function AIConfiguration({ onNavigateBack }: AIConfigurationProps) {
  // Check if user is superuser
  if (!isSuperuser()) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            You don't have superuser privileges to access AI configuration settings. Only superuser administrators can modify AI service configurations.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-yellow-800">
                <strong>Contact your superuser administrator</strong> if you need to update AI configuration settings or require elevated privileges.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [config, setConfig] = useState<AIConfig>({
    ai_base_url: '',
    ai_model: '',
    api_key_set: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState(''); // New state for API key input
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchConfig(true); // Always fetch the API key on initial load
  }, []);

  const fetchConfig = async (includeApiKey = false) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Build URL with query parameter if we want to include the API key
      const url = `${API_BASE_URL}/api/admin/ai-config${includeApiKey ? '?include_api_key=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI configuration');
      }

      const data = await response.json();
      setConfig(data);
      // If the API key was included in the response, set it in the input field
      if (includeApiKey && data.ai_api_key) {
        setCurrentApiKey(data.ai_api_key);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      setSuccess(false);

      const token = getAuthToken();
      if (!token) {
        setError('Authentication required');
        setSaving(false);
        return;
      }

      const payload: any = {
        ai_base_url: config.ai_base_url,
        ai_model: config.ai_model,
      };

      // Only include API key if user has entered a new one
      if (currentApiKey.trim()) {
        payload.ai_api_key = currentApiKey.trim();
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/ai-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update AI configuration');
      }

      setSuccess(true);
      
      // Refresh config data (including API key to properly display it)
      // but without showing loading state to avoid page disappearing
      if (token) {
        const url = `${API_BASE_URL}/api/admin/ai-config?include_api_key=true`;
        const refreshResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setConfig(data);
          // If the API key was included in the response, set it in the input field
          if (data.ai_api_key) {
            setCurrentApiKey(data.ai_api_key);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const validateUrl = async (url: string) => {
    if (!url) {
      setUrlValid(null);
      return;
    }

    setIsValidatingUrl(true);
    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        setUrlValid(false);
        return;
      }
      setUrlValid(true);
    } catch (error) {
      setUrlValid(false);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleBaseUrlChange = (value: string) => {
    setConfig({...config, ai_base_url: value});
    setError(null);
    setSuccess(false);
    validateUrl(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with gradient background matching admin dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              AI Configuration
            </h2>
            <p className="text-blue-100 text-sm">Configure AI service settings for generating financial insights</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateBack?.()}
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </div>
      </motion.div>

      {/* Alert Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">AI configuration updated successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced AI Service Settings Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">AI Service Settings</h3>
            </div>
            <div className="space-y-3">
              {/* Base URL */}
              <div>
                <Label htmlFor="base-url" className="text-gray-700 font-medium text-sm">Base URL</Label>
                <div className="relative mt-1">
                  <Input
                    id="base-url"
                    value={config.ai_base_url}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="pr-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm text-sm"
                  />
                  {isValidatingUrl && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    </div>
                  )}
                  {urlValid !== null && !isValidatingUrl && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                      {urlValid ? (
                        <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">The base URL for the AI service API (e.g., https://api.openai.com/v1)</p>
                {urlValid === false && (
                  <p className="text-xs text-red-600 mt-1">Please enter a valid URL starting with http:// or https://</p>
                )}
              </div>

              {/* Model */}
              <div>
                <Label htmlFor="model" className="text-gray-700 font-medium text-sm">Model</Label>
                <Input
                  id="model"
                  value={config.ai_model}
                  onChange={(e) => {
                    setConfig({...config, ai_model: e.target.value});
                    setError(null);
                    setSuccess(false);
                  }}
                  placeholder="gpt-4, claude-3-opus-20240229, etc."
                  className="mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">The AI model to use for generating insights</p>
              </div>

              {/* Current Status */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Current Status:</span>
                  <Badge
                    variant={config.api_key_set ? "default" : "secondary"}
                    className={`${config.api_key_set
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                    } text-xs`}
                  >
                    {config.api_key_set ? 'API Key Set' : 'No API Key'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* API Key Section */}
            <div className="pt-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="api-key" className="text-gray-700 font-medium text-sm">API Key</Label>
                  {config.api_key_set && !showApiKey && (
                    <span className="text-xs text-blue-600">Click eye to view</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={currentApiKey}
                    onChange={(e) => {
                      setCurrentApiKey(e.target.value);
                      setError(null);
                      setSuccess(false);
                    }}
                    placeholder={config.api_key_set && !showApiKey && !currentApiKey ? "••••••••••••••••" : "Enter your API key"}
                    className="pr-8 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm text-sm"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors duration-200"
                    onClick={() => {
                      const newShowState = !showApiKey;
                      setShowApiKey(newShowState);
                    }}
                  >
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Current status: {config.api_key_set ? 'API key is set' : 'No API key configured'}.
                  {showApiKey ? ' Edit above to change' : ' Click eye to view'} API key, or enter a new key to replace it.
                </p>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="flex gap-2 pt-3">
              <Button
                onClick={handleSave}
                disabled={saving || urlValid === false}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm px-3 py-1.5"
                size="sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Config
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentApiKey('');
                  setShowApiKey(false);
                  setError(null);
                  setSuccess(false);
                }}
                disabled={saving}
                className="bg-white/80 backdrop-blur-sm hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm transition-all duration-300 hover:shadow-md text-sm px-3 py-1.5"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Security Information */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Security Information</h3>
            </div>
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Secure Storage</h4>
                    <p className="text-xs text-gray-600">API keys are encrypted and stored securely in the database with restricted access.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Restricted Access</h4>
                    <p className="text-xs text-gray-600">Only superuser administrators can access and modify AI configuration settings.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Audit Trail</h4>
                    <p className="text-xs text-gray-600">All configuration changes are logged with timestamps and user identification for accountability.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Frontend Protection</h4>
                    <p className="text-xs text-gray-600">API keys are never exposed in frontend code or browser console for maximum security.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}