import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/scripts/hero-preload-v2.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
  images: {
    localPatterns: [{ pathname: '/images/**', search: '' }],
    qualities: [60, 75, 85],
    // Pre-encoded hero AVIFs are served directly. Avoid expensive cold AVIF encoding on the VPS.
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
