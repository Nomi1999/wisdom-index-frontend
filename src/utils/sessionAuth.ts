
import { jwtDecode } from 'jwt-decode';

// Define types for our authentication
export interface DecodedToken {
  sub: string; // JWT subject field contains the user_id
  client_id?: string;
  exp: number;
  iat: number;
  jti?: string;
  type?: string;
  fresh?: boolean;
}

export interface AdminUser {
  user_id: number;
  client_id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperuser?: boolean;
}

export interface User {
  client_id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  isSuperuser?: boolean;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  isSuperuser?: boolean;
  createdAt: number;
  lastAccessed: number;
}

// Session registry interface for localStorage
interface SessionRegistry {
  [sessionId: string]: SessionInfo;
}

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get session registry from localStorage
const getSessionRegistry = (): SessionRegistry => {
  if (typeof window === 'undefined') return {};
  try {
    const registry = localStorage.getItem('sessionRegistry');
    return registry ? JSON.parse(registry) : {};
  } catch (error) {
    console.error('Error parsing session registry:', error);
    return {};
  }
};

// Save session registry to localStorage
const saveSessionRegistry = (registry: SessionRegistry): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sessionRegistry', JSON.stringify(registry));
  } catch (error) {
    console.error('Error saving session registry:', error);
  }
};

// Clean up expired sessions from registry
const cleanupExpiredSessions = (registry: SessionRegistry): SessionRegistry => {
  const now = Date.now();
  const cleanedRegistry: SessionRegistry = {};
  
  Object.keys(registry).forEach(sessionId => {
    const session = registry[sessionId];
    // Remove sessions older than 24 hours
    if (now - session.createdAt < 24 * 60 * 60 * 1000) {
      cleanedRegistry[sessionId] = session;
    }
  });
  
  return cleanedRegistry;
};

// Check if the token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Get current session ID from sessionStorage
export const getCurrentSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('currentSessionId');
};

// Get token from sessionStorage
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('authToken');
};

// Get stored user data from sessionStorage
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }
  return null;
};

// Save token and user data to sessionStorage and register session
export const setToken = (token: string, user: User): void => {
  if (typeof window === 'undefined') return;
  
  const sessionId = generateSessionId();
  const decoded = jwtDecode<DecodedToken>(token);
  
  // Save to sessionStorage (tab-specific)
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('currentSessionId', sessionId);
  
  // Register session in localStorage (cross-tab awareness)
  const registry = getSessionRegistry();
  const cleanedRegistry = cleanupExpiredSessions(registry);
  
  cleanedRegistry[sessionId] = {
    sessionId,
    userId: decoded.sub, // Use sub field instead of user_id
    username: user.username,
    isAdmin: user.isAdmin || false,
    isSuperuser: user.isSuperuser || false,
    createdAt: Date.now(),
    lastAccessed: Date.now()
  };
  
  saveSessionRegistry(cleanedRegistry);
};

// Remove token and user data from sessionStorage and unregister session
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  
  const sessionId = getCurrentSessionId();
  
  // Remove from sessionStorage
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('currentSessionId');
  
  // Clear AI insights cache when logging out
  sessionStorage.removeItem('adminInsightsCache');
  sessionStorage.removeItem('adminSessionId');
  sessionStorage.removeItem('adminCacheCleared');
  
  // Remove from registry if session exists
  if (sessionId) {
    const registry = getSessionRegistry();
    delete registry[sessionId];
    saveSessionRegistry(registry);
  }
};

// Update session access time
export const updateSessionAccess = (): void => {
  if (typeof window === 'undefined') return;
  
  const sessionId = getCurrentSessionId();
  if (!sessionId) return;
  
  const registry = getSessionRegistry();
  if (registry[sessionId]) {
    registry[sessionId].lastAccessed = Date.now();
    saveSessionRegistry(registry);
  }
};

// Validate current session ownership
export const validateSessionOwnership = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const sessionId = getCurrentSessionId();
  const token = getToken();
  const user = getStoredUser();
  
  if (!sessionId || !token || !user) {
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    removeToken();
    return false;
  }
  
  // Check if session exists in registry
  const registry = getSessionRegistry();
  const session = registry[sessionId];
  
  if (!session) {
    // Session not found in registry, might be cleared
    return false;
  }
  
  // Verify session matches current user
  const decoded = jwtDecode<DecodedToken>(token);
  if (session.userId !== decoded.sub || session.username !== user.username) {
    // Session mismatch, clear current session
    removeToken();
    return false;
  }
  
  // Update access time
  updateSessionAccess();
  
  return true;
};

// Check if current user is admin
export const isAdminUser = (): boolean => {
  const user = getStoredUser();
  return user?.isAdmin || false;
};

// Check if current user is superuser
export const isSuperuser = (): boolean => {
  const user = getStoredUser();
  return user?.isSuperuser || false;
};

// Check admin status via API
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const token = getToken();
    console.log('[SessionAuth] Checking admin status, token exists:', !!token);
    if (!token) return false;

    const response = await fetch('/api/proxy/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[SessionAuth] Admin status check response:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('[SessionAuth] Admin status check data:', data);
      console.log('[SessionAuth] User isAdmin:', data.user?.isAdmin);
      return data.user?.isAdmin || false;
    }
    return false;
  } catch (error) {
    console.error('[SessionAuth] Error checking admin status:', error);
    return false;
  }
};

// Check superuser status via API
export const checkSuperuserStatus = async (): Promise<boolean> => {
  try {
    const token = getToken();
    console.log('[SessionAuth] Checking superuser status, token exists:', !!token);
    if (!token) return false;

    const response = await fetch('/api/proxy/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[SessionAuth] Superuser status check response:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('[SessionAuth] Superuser status check data:', data);
      console.log('[SessionAuth] User isSuperuser:', data.user?.isSuperuser);
      return data.user?.isSuperuser || false;
    }
    return false;
  } catch (error) {
    console.error('[SessionAuth] Error checking superuser status:', error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }
  return !isTokenExpired(token);
};

// Get user info from token
export const getCurrentUser = (): DecodedToken | null => {
  const token = getToken();
  if (token && !isTokenExpired(token)) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('[SessionAuth] Decoded token:', decoded);
      console.log('[SessionAuth] User ID from token (sub):', decoded.sub, typeof decoded.sub);
      console.log('[SessionAuth] Client ID from token:', decoded.client_id, typeof decoded.client_id);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
};

// Get auth token for API requests
export const getAuthToken = (): string | null => {
  return getToken();
};

// Enhanced login function with session management
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    console.log('[SessionAuth] Attempting login with username:', username);
    const response = await fetch('/api/proxy/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('[SessionAuth] Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[SessionAuth] Login response data:', data);
      
      // Clear any existing session
      removeToken();
      
      // Set new session
      setToken(data.access_token, data.user);
      
      // Redirect based on user role
      if (data.user.isAdmin) {
        console.log('[SessionAuth] Admin user detected, redirecting to /admin');
        window.location.href = '/admin';
      } else {
        console.log('[SessionAuth] Regular user detected, redirecting to /dashboard');
        window.location.href = '/dashboard';
      }
      
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SessionAuth] Login failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('[SessionAuth] Login error:', error);
    return false;
  }
};

// Enhanced logout function
export const logout = (): void => {
  console.log('[SessionAuth] Logout initiated, clearing session');
  removeToken();
  window.location.href = '/login';
};

// Require admin access (redirects if not admin)
export const requireAdmin = async (): Promise<void> => {
  console.log('[SessionAuth] requireAdmin called');
  
  // First validate session ownership
  if (!validateSessionOwnership()) {
    console.log('[SessionAuth] Session validation failed, redirecting to login');
    window.location.href = '/login';
    return;
  }
  
  const isAdmin = await checkAdminStatus();
  console.log('[SessionAuth] requireAdmin - isAdmin result:', isAdmin);
  if (!isAdmin) {
    console.log('[SessionAuth] Not admin, redirecting to dashboard');
    window.location.href = '/dashboard';
  } else {
    console.log('[SessionAuth] Admin access confirmed');
  }
};