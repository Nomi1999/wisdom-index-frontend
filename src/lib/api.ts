const sanitizeBaseUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  return url.replace(/\/$/, '');
};

const ENV_BASE_URL =
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ??
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

const SERVER_FALLBACK_BASE_URL =
  sanitizeBaseUrl(process.env.INTERNAL_API_URL) ?? 'http://localhost:5001';

const BROWSER_PROXY_PREFIX = '/api/proxy';

const ensureLeadingSlash = (path: string): string => {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with a leading slash, e.g. /auth/login');
  }
  return path;
};

export const getApiBaseUrl = (): string => {
  if (ENV_BASE_URL) {
    return ENV_BASE_URL;
  }

  if (typeof window === 'undefined') {
    return SERVER_FALLBACK_BASE_URL;
  }

  return BROWSER_PROXY_PREFIX;
};

export const buildApiUrl = (path: string): string => {
  return `${getApiBaseUrl()}${ensureLeadingSlash(path)}`;
};
