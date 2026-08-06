/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
  async rewrites() {
    // Serve the LMS app (separate Next.js 16 app) under /lms.
    // Requests to /lms/* are proxied to the LMS frontend, which runs with
    // basePath '/lms' so all its internal routes and assets line up.
    return [
      {
        source: '/lms/:path*',
        destination: 'http://localhost:3001/lms/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
