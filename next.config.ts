/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // This is required to allow the development server to be accessed from the Firebase Studio preview URL.
  allowedDevOrigins: [
    "https://6000-firebase-studio-1759130826485.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev"
  ],
}

export default nextConfig;
