import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚡ Performance & Optimization (Turbopack compatible)
  compress: true, // Enable gzip compression
  
  // 🖼️ Image optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Modern image formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary CDN for product images
      },
    ],
  },

  // 🚀 Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production
  poweredByHeader: false, // Remove X-Powered-By header
  
  // 🔗 Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'], // Optimize lucide-react imports
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {},
};

export default nextConfig;
