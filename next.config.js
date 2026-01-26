/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows the cloud workstation to communicate with your dev server
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-studio-1768934799133.cluster-iusnsmywp5clov45nv5gsxt5he.cloudworkstations.dev',
      '9000-firebase-studio-1768934799133.cluster-iusnsmywp5clov45nv5gsxt5he.cloudworkstations.dev'
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
