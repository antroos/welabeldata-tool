/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  appDir: true,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app',
      },
    ]
  },
}

module.exports = nextConfig 