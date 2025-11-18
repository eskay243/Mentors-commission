/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output for Docker
  images: {
    domains: ['images.unsplash.com'],
  },
}

module.exports = nextConfig
