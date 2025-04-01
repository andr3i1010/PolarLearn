import type { NextConfig } from "next";
const { version } = require('./package.json');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    appVersion: version,
  },
  experimental: {
    ppr: 'incremental'
  }
};

export default nextConfig;