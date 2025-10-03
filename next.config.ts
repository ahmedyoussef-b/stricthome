import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'https://picsum.photos/seed',
      },
    ],
  },
};

export default nextConfig;
