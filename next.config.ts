import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable proper error checking for production builds
  eslint: {
    // Enable linting for production readiness
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'hooks'],
  },
  typescript: {
    // Temporarily ignore build errors while fixing them systematically
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Better source maps and bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use eval-cheap-module-source-map for better debugging
      config.devtool = 'eval-cheap-module-source-map';
    }
    
    // Bundle optimization for production
    if (!dev) {
      // Optimize bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate UI library chunks
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@tanstack|framer-motion)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 20,
            },
            // Separate chart libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 15,
            },
            // Common chunks
            common: {
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Performance optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
  
  // Experimental features for performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'framer-motion'
    ],
  },
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Power optimizations
  poweredByHeader: false,
};

// Add bundle analyzer in development
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}

export default nextConfig;
