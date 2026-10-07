import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['172.16.0.2', 'localhost:3000'],
};

export default nextConfig;
