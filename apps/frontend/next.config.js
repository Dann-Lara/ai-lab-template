/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@ai-lab/shared'],
  experimental: {
    typedRoutes: true,
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }],
      },
    ];
  },
};

module.exports = nextConfig;
