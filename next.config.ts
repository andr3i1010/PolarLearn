import { withSentryConfig } from '@sentry/nextjs';
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
  },
  productionBrowserSourceMaps: true
};

// Only apply Sentry config in production
const config = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withPWA(nextConfig), {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "polarnl",
    project: "polarlearn",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    tunnelRoute: "/error-report",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  })
  : withPWA(nextConfig);

export default config;