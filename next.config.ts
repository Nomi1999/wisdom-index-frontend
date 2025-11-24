import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure API base URL for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  },
  // Enable standalone output for deployment
  output: 'standalone',
  // Configure trailing slash behavior
  trailingSlash: true,
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
