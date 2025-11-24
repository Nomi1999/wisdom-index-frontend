'use client';

import { useEffect, useState } from 'react';
import { requireAdmin } from '@/utils/sessionAuth';
import { useSessionAuth } from '@/hooks/useSessionAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Use session auth hook for validation
  const { isValid: sessionValid, isLoading: sessionLoading } = useSessionAuth({
    onSessionInvalid: () => {
      console.log('[Admin Layout] Session validation failed, redirecting to login');
      window.location.href = '/login';
    },
    validateOnMount: true,
    validateOnVisibilityChange: false,
    validateOnFocus: false
  });

  useEffect(() => {
    const checkAuthorization = async () => {
      console.log('[Admin Layout] Checking authorization...');
      
      // Wait for session validation to complete
      if (sessionLoading) {
        console.log('[Admin Layout] Session validation in progress...');
        return;
      }
      
      if (!sessionValid) {
        console.log('[Admin Layout] Session validation failed, not authorized');
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      
      try {
        await requireAdmin();
        console.log('[Admin Layout] Admin authorization successful');
        setIsAuthorized(true);
      } catch (error) {
        console.error('[Admin Layout] Admin authorization failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [sessionValid, sessionLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
            <p className="text-sm text-gray-500 mb-6">This area is restricted to Wisdom Index administrators only.</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Client Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}