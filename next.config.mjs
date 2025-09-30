/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    devServer: {
      allowedDevOrigins: [
        'https://*.cloudworkstations.dev',
      ],
    }
  },
};

export default nextConfig;
