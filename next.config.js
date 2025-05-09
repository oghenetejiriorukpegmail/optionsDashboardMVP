/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['sqlite3', 'ta-lib'],
  },
  webpack: (config) => {
    // SQLite binary loading
    config.externals.push('sqlite3');
    
    return config;
  },
};

module.exports = nextConfig;
