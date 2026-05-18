/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow POST/Server Actions from LAN origin during dev (Next 15+ blocks cross-origin by default).
  // Add other IPs / hostnames here if you reach the dev server from more devices.
  allowedDevOrigins: ['192.168.1.213', '192.168.1.213:3000', 'localhost', 'localhost:3000', '172.20.10.2:3000', '172.20.10.2'],
}

export default nextConfig
