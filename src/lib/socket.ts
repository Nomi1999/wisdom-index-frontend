import { io } from 'socket.io-client';
import { getApiBaseUrl } from './api';

// Create a socket instance pointing to the backend URL
// We use getApiBaseUrl() but ensure we don't use the proxy path if possible,
// or rely on the fact that socket.io might need the actual backend port if proxying WS is not set up.
// However, for simplicity and robustness, we'll try to use the environment variable first.

const getSocketUrl = () => {
  // If we are in the browser, we might need to point to the actual backend if nextjs proxy doesn't handle WS upgrade.
  // But if NEXT_PUBLIC_API_URL is set (which it is in next.config.ts to localhost:5001), we use that.
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  return url;
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'], // Try websocket first
});
