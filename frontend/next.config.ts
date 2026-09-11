import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 92],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Prevent development-only Strict Mode effect replays from duplicating
  // admin/API requests while keeping production behavior unchanged.
  reactStrictMode: false,
};

export default nextConfig;
