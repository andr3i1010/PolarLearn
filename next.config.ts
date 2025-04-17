import type { NextConfig } from "next";
const { version } = require('./package.json');
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-calls',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 1 month
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  // Set dev-specific options for better debugging
  buildExcludes: [], // Don't exclude any files in development
  mode: 'production', // Force production mode even in development
  dynamicStartUrl: false // Use a static start URL
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    appVersion: version,
  },
  experimental: {
    nodeMiddleware: true,
    ppr: 'incremental'
  }
};

export default withPWA(nextConfig);