/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 16 / Turbopack walks up from the app looking for a package-lock.json
  // to infer the workspace root. A stray lockfile higher up (e.g. in the XAMPP
  // webroot) makes it scan huge directories and OOM. Pin the real project root.
  turbopack: {
    root: __dirname,
  },

  // Serve the whole LMS app under /lms so it runs inside BizTrack's origin.
  // All internal links (/, /login, /admin, ...) are automatically prefixed
  // with /lms, so the app works when proxied through the BizTrack frontend
  // (localhost:3000/lms) without needing its own separate entry point.
  basePath: '/lms',

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
      },
    ],
  },

  // API proxy for development (fallback only - the app uses NEXT_PUBLIC_API_URL).
  async rewrites() {
    return [
      {
        source: '/lms/api/v1/:path*',
        destination: 'http://localhost:8001/api/v1/:path*',
      },
    ];
  },

  // Environment variables that should be available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'LMS Platform',
  },
};

module.exports = nextConfig;