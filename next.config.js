/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,     // (this is optional, based on your routing preference)
  images: {
    unoptimized: true      // (this is fine if you want to disable Next.js image optimization)
  }
}

module.exports = nextConfig