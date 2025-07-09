/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/resources-unhingedone',
  assetPrefix: '/resources-unhingedone',
  trailingSlash: true,
  
  // Image configuration for external domains
  images: {
    domains: [
      'printify.com',
      'printify-upload.s3.amazonaws.com',
      'aurafarming.co'
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/resources-unhingedone/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig 