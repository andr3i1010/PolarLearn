import type { NextConfig } from "next";
const { version } = require('./package.json');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    appVersion: version,
  },
};

export default nextConfig;