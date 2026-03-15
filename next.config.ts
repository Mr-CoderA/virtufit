import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bull', 'ioredis'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.replicate.delivery', pathname: '/**' },
      { protocol: 'https', hostname: 'replicate.delivery', pathname: '/**' },
      { protocol: 'https', hostname: '*.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
