/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel-specific optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Prevent Mongoose from being bundled (serverless compatibility)
  serverExternalPackages: ['mongoose'],

  // Output configuration for Vercel
  output: 'standalone',

  // Optimize for production
  productionBrowserSourceMaps: false,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Experimental features for Next.js 16
  experimental: {
    // Server actions configuration
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
