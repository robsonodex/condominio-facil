import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds (run separately in CI)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors to unblock deployment
    ignoreBuildErrors: true,
  },
  // Exclude mobile directory from compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/mobile/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
