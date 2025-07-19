import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
const { version } = require('./package.json');

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable in development for faster builds
  publicRuntimeConfig: {
    appVersion: version,
  },
  experimental: {
    nodeMiddleware: true,
    ppr: 'incremental',
    reactCompiler: process.env.NODE_ENV === 'production', // Only enable in production
    // Optimize bundling
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production',
};

// Only apply Sentry config in production
const config = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
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
  : nextConfig;

export default config;