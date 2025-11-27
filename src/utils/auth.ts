import { jwtDecode } from 'jwt-decode';
import { buildApiUrl } from '@/lib/api';

// Define types for our authentication
export interface DecodedToken {
  user_id: string;
  client_id: string;
  exp: number;
  iat: number;
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

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Get stored user data from localStorage
export const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
  }
  return null;
};

// Save user data to localStorage
export const setStoredUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Remove user data from localStorage
export const removeStoredUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

// Check if current user is admin
export const isAdminUser = (): boolean => {
  const user = getStoredUser();
  return user?.isAdmin || false;
};

// Check admin status via API
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const token = getToken();
    console.log('[Auth] Checking admin status, token exists:', !!token);
    if (!token) return false;

    const response = await fetch(buildApiUrl('/auth/verify'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Auth] Admin status check response:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('[Auth] Admin status check data:', data);
      console.log('[Auth] User isAdmin:', data.user?.isAdmin);
      return data.user?.isAdmin || false;
    }
    return false;
  } catch (error) {
    console.error('[Auth] Error checking admin status:', error);
    return false;
  }
};

// Check superuser status via API
export const checkSuperuserStatus = async (): Promise<boolean> => {
  try {
    const token = getToken();
    console.log('[Auth] Checking superuser status, token exists:', !!token);
    if (!token) return false;

    const response = await fetch(buildApiUrl('/auth/verify'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Auth] Superuser status check response:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('[Auth] Superuser status check data:', data);
      console.log('[Auth] User isSuperuser:', data.user?.isSuperuser);
      return data.user?.isSuperuser || false;
    }
    return false;
  } catch (error) {
    console.error('[Auth] Error checking superuser status:', error);
    return false;
  }
};

// Check if current user is superuser
export const isSuperuser = (): boolean => {
  const user = getStoredUser();
  return user?.isSuperuser || false;
};

// Require admin access (redirects if not admin)
export const requireAdmin = async (): Promise<void> => {
  console.log('[Auth] requireAdmin called');
  const isAdmin = await checkAdminStatus();
  console.log('[Auth] requireAdmin - isAdmin result:', isAdmin);
  if (!isAdmin) {
    console.log('[Auth] Not admin, redirecting to dashboard');
    // Redirect to regular dashboard or show access denied
    window.location.replace('/dashboard');
  } else {
    console.log('[Auth] Admin access confirmed');
  }
};

// Login function with admin redirect handling
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    console.log('[Auth] Attempting login with username:', username);
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('[Auth] Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Auth] Login response data:', data);
      setToken(data.access_token);
      setStoredUser(data.user);
      
      // Redirect based on user role
      if (data.user.isAdmin) {
        console.log('[Auth] Admin user detected, redirecting to /admin');
        window.location.replace('/admin');
      } else {
        console.log('[Auth] Regular user detected, redirecting to /dashboard');
        window.location.replace('/dashboard');
      }
      
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Auth] Login failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return false;
  }
};

// Logout function
export const logout = (): void => {
  removeToken();
  removeStoredUser();
  window.location.replace('/login');
};

// Get auth token for API requests
export const getAuthToken = (): string | null => {
  return getToken();
};

// Save token to localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
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
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
};
