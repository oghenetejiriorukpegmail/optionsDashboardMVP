/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ['sqlite3', 'ta-lib'],
  webpack: (config) => {
    // SQLite binary loading
    config.externals.push('sqlite3');
    
    return config;
  },
};

module.exports = nextConfig;
