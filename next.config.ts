import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable proper error checking for production builds
  eslint: {
    // Only ignore during builds in development for faster iteration
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
    // In production, we want to catch linting errors
    dirs: ['src', 'pages', 'components', 'lib', 'hooks'],
  },
  typescript: {
    // Enable TypeScript error checking in production builds
    // ignoreBuildErrors: false, // This is the default, so we can omit it
    
    // Optional: Configure TypeScript checking behavior
    tsconfigPath: './tsconfig.json',
  },
  // Better source maps for debugging
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use eval-cheap-module-source-map for better debugging
      config.devtool = 'eval-cheap-module-source-map';
    }
    return config;
  },
  // Experimental features for better debugging
  experimental: {
    // Improve debugging experience
    optimizePackageImports: [],
  },
};

export default nextConfig;
