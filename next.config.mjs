import withSerwist from '@serwist/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow POST/Server Actions from LAN origin during dev (Next 15+ blocks cross-origin by default).
  // Add other IPs / hostnames here if you reach the dev server from more devices.
  allowedDevOrigins: ['192.168.1.213', '192.168.1.213:3000', 'localhost', 'localhost:3000', '172.20.10.2:3000', '172.20.10.2'],
}

// @serwist/next is a webpack plugin and ALWAYS injects a `webpack` config key,
// which Next 16's default Turbopack dev server rejects (the `disable` option is
// not enough — the key is still added). So we apply withSerwist ONLY for the
// production build (run via `next build --webpack`, see package.json). In dev,
// `next dev` gets the plain config and stays on Turbopack with no webpack key.
export default process.env.NODE_ENV === 'development'
  ? nextConfig
  : withSerwist({
      swSrc: 'app/sw.ts',
      swDest: 'public/sw.js',
      cacheOnNavigation: true,
      reloadOnOnline: true,
    })(nextConfig)
