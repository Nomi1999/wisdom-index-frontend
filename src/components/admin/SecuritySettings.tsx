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
import { buildApiUrl } from '@/lib/api';

interface SecurityCodeStatus {
  security_code_exists: boolean;
  security_code: string | null;
  security_code_length: number;
  last_updated: string | null;
  updated_by: {
    user_id: string;
    username: string;
    email: string;
  } | null;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  complexity_score: number;
  complexity_requirements: {
    has_uppercase: boolean;
    has_lowercase: boolean;
    has_digit: boolean;
    has_special: boolean;
  };
}

interface SecuritySettingsProps {
  onNavigateBack?: () => void;
}

export function SecuritySettings({ onNavigateBack }: SecuritySettingsProps) {
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
            You don't have superuser privileges to access security settings. Only superuser administrators can manage security codes and system security configurations.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-yellow-800">
                <strong>Contact your superuser administrator</strong> if you need to update security settings or require elevated privileges.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [securityStatus, setSecurityStatus] = useState<SecurityCodeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Form states
  const [newSecurityCode, setNewSecurityCode] = useState('');
  const [confirmSecurityCode, setConfirmSecurityCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  

  useEffect(() => {
    fetchSecurityCodeStatus();
  }, []);

  const fetchSecurityCodeStatus = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl('/api/admin/security-code'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityStatus(data);
      } else {
        throw new Error('Failed to fetch security code status');
      }
    } catch (error) {
      console.error('Error fetching security code status:', error);
      setErrorMessage('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSecurityCode = async (code: string) => {
    if (!code) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl('/api/admin/security-code/validate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ security_code: code }),
      });

      if (response.ok) {
        const data = await response.json();
        setValidationResult(data);
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      console.error('Error validating security code:', error);
      setValidationResult({
        valid: false,
        errors: ['Validation service unavailable'],
        complexity_score: 0,
        complexity_requirements: {
          has_uppercase: false,
          has_lowercase: false,
          has_digit: false,
          has_special: false,
        },
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSecurityCodeChange = (value: string) => {
    setNewSecurityCode(value);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate with debounce
    const timeoutId = setTimeout(() => {
      validateSecurityCode(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleConfirmSecurityCodeChange = (value: string) => {
    setConfirmSecurityCode(value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleUpdateSecurityCode = async () => {
    // Reset states
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validation
    if (!newSecurityCode || !confirmSecurityCode) {
      setErrorMessage('Both security code fields are required');
      return;
    }

    if (newSecurityCode !== confirmSecurityCode) {
      setErrorMessage('Security codes do not match');
      return;
    }

    if (validationResult && !validationResult.valid) {
      setErrorMessage('Please fix the validation errors before updating');
      return;
    }

    setIsUpdating(true);
    try {
      const token = getAuthToken();
      const response = await fetch(buildApiUrl('/api/admin/security-code'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_security_code: newSecurityCode,
          confirm_security_code: confirmSecurityCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        
        // Reset form
        setNewSecurityCode('');
        setConfirmSecurityCode('');
        setValidationResult(null);
        
        // Refresh status
        await fetchSecurityCodeStatus();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update security code');
      }
    } catch (error) {
      console.error('Error updating security code:', error);
      setErrorMessage('Failed to update security code');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getComplexityColor = (score: number) => {
    if (score <= 1) return 'text-red-600 bg-red-100';
    if (score <= 2) return 'text-yellow-600 bg-yellow-100';
    if (score <= 3) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getComplexityText = (score: number) => {
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score <= 3) return 'Good';
    return 'Strong';
  };

  if (isLoading) {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              Security Settings
            </h2>
            <p className="text-blue-100 text-sm">Manage admin registration security codes and access controls</p>
          </div>
          {onNavigateBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateBack}
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Current Status Card */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Security Code Status</h3>
            </div>
            
            {securityStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Status:</span>
                      <Badge
                        variant={securityStatus.security_code_exists ? "default" : "secondary"}
                        className={`${securityStatus.security_code_exists
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                        } text-xs`}
                      >
                        {securityStatus.security_code_exists ? 'Active' : 'Not Set'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Current Security Code:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-blue-600">
                          {securityStatus.security_code || 'Not set'}
                        </span>
                        <span className="text-xs text-gray-500">({securityStatus.security_code_length} chars)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Last Updated:</span>
                      <span className="text-xs text-gray-900">{formatDate(securityStatus.last_updated)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {securityStatus.updated_by ? (
                    <>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {securityStatus.updated_by.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-700">Updated By:</div>
                            <div className="text-xs font-semibold text-gray-900">{securityStatus.updated_by.username}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Email:</span>
                          <span className="text-xs text-gray-900">{securityStatus.updated_by.email}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-gray-500 italic flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        No update history available
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Update Security Code Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Update Security Code</h3>
            </div>
        
            <div className="space-y-3">
              {/* New Security Code */}
              <div>
                <Label htmlFor="new_security_code" className="text-gray-700 font-medium text-sm">New Security Code</Label>
                <div className="relative mt-1">
                  <Input
                    id="new_security_code"
                    type={showPassword ? "text" : "password"}
                    value={newSecurityCode}
                    onChange={(e) => handleSecurityCodeChange(e.target.value)}
                    placeholder="Enter new security code"
                    className="pr-8 border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-100 rounded-r-md transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
           
            {/* Real-time validation feedback */}
            {isValidating && (
              <div className="mt-1 text-xs text-gray-500">Validating...</div>
            )}
            
            {validationResult && newSecurityCode && (
              <div className="mt-2 space-y-1.5">
                {/* Complexity indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Strength:</span>
                  <Badge className={`${getComplexityColor(validationResult.complexity_score)} text-xs`}>
                    {getComplexityText(validationResult.complexity_score)}
                  </Badge>
                </div>
                
                {/* Complexity requirements */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className={`flex items-center gap-1 ${validationResult.complexity_requirements.has_uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      {validationResult.complexity_requirements.has_uppercase ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>Uppercase</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${validationResult.complexity_requirements.has_lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      {validationResult.complexity_requirements.has_lowercase ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>Lowercase</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${validationResult.complexity_requirements.has_digit ? 'text-green-600' : 'text-gray-400'}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      {validationResult.complexity_requirements.has_digit ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>Number</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${validationResult.complexity_requirements.has_special ? 'text-green-600' : 'text-gray-400'}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      {validationResult.complexity_requirements.has_special ? (
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>Special</span>
                  </div>
                </div>
                
                {/* Validation errors */}
                {validationResult.errors.length > 0 && (
                  <div className="text-red-600 text-xs space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

              {/* Confirm Security Code */}
              <div>
                <Label htmlFor="confirm_security_code" className="text-gray-700 font-medium text-sm">Confirm Security Code</Label>
                <Input
                  id="confirm_security_code"
                  type="password"
                  value={confirmSecurityCode}
                  onChange={(e) => handleConfirmSecurityCodeChange(e.target.value)}
                  placeholder="Confirm new security code"
                  className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm text-sm"
                />
           
            {/* Match indicator */}
            {confirmSecurityCode && (
              <div className="mt-1 text-xs">
                {newSecurityCode === confirmSecurityCode ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Codes match</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Codes don't match</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alert Messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive" className="text-xs">
                  <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 text-xs">{successMessage}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

              {/* Enhanced Submit Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUpdateSecurityCode}
                  disabled={isUpdating || !newSecurityCode || !confirmSecurityCode || (validationResult?.valid === false)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] text-sm px-3 py-1.5"
                  size="sm"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Update Code
                    </>
                  )}
                </Button>
               
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewSecurityCode('');
                    setConfirmSecurityCode('');
                    setValidationResult(null);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  disabled={isUpdating}
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
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Security Guidelines */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
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
              <h3 className="text-base font-bold text-gray-900">Security Guidelines</h3>
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
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Minimum Requirements</h4>
                    <p className="text-xs text-gray-600">Security codes must be at least 8 characters long and contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters.</p>
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
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Regular Updates</h4>
                    <p className="text-xs text-gray-600">Change your security code periodically to maintain system security and protect against unauthorized access.</p>
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
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Secure Sharing</h4>
                    <p className="text-xs text-gray-600">Only share the security code with authorized financial advisors who need admin access to the system.</p>
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
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Audit Trail</h4>
                    <p className="text-xs text-gray-600">All security code changes are logged with the user who made the change and timestamp for complete accountability.</p>
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