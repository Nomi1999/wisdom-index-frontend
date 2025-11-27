
import { useEffect, useState } from 'react';
import { 
  validateSessionOwnership, 
  isAuthenticated, 
  removeToken, 
  getStoredUser,
  updateSessionAccess 
} from '@/utils/sessionAuth';

export interface UseSessionAuthOptions {
  onSessionInvalid?: () => void;
  validateOnMount?: boolean;
  validateOnVisibilityChange?: boolean;
  validateOnFocus?: boolean;
}

export interface UseSessionAuthReturn {
  isValid: boolean;
  isLoading: boolean;
  user: any | null;
  validateSession: () => boolean;
  logout: () => void;
}

export const useSessionAuth = (options: UseSessionAuthOptions = {}): UseSessionAuthReturn => {
  const {
    onSessionInvalid,
    validateOnMount = true,
    validateOnVisibilityChange = true,
    validateOnFocus = true
  } = options;

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const validateSession = (): boolean => {
    const sessionValid = validateSessionOwnership() && isAuthenticated();
    
    if (!sessionValid) {
      setIsValid(false);
      setUser(null);
      
      if (onSessionInvalid) {
        onSessionInvalid();
      } else {
        // Default behavior: redirect to login
        removeToken();
        window.location.replace('/login');
      }
    } else {
      setIsValid(true);
      setUser(getStoredUser());
      updateSessionAccess(); // Update session access time
    }
    
    return sessionValid;
  };

  const logout = () => {
    removeToken();
    setIsValid(false);
    setUser(null);
    window.location.replace('/login');
  };

  // Initial validation on mount
  useEffect(() => {
    if (validateOnMount) {
      setIsLoading(true);
      const valid = validateSession();
      setIsLoading(false);
      
      if (valid) {
        setUser(getStoredUser());
      }
    } else {
      setIsLoading(false);
    }
  }, [validateOnMount]);

  // Validate on visibility change (user switches back to tab)
  useEffect(() => {
    if (!validateOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [validateOnVisibilityChange]);

  // Validate on window focus (additional safety net)
  useEffect(() => {
    if (!validateOnFocus) return;

    const handleFocus = () => {
      validateSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [validateOnFocus]);

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isValid) {
        validateSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isValid]);

  return {
    isValid,
    isLoading,
    user,
    validateSession,
    logout
  };
};

export default useSessionAuth;