import type { NextConfig } from "next";
const { version } = require('./package.json');

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

export default nextConfig;