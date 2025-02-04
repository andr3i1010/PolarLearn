import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'obscure-winner-445jj64q9vh7ppp-3000.app.github.dev'],
    },
  },
};

export default nextConfig;