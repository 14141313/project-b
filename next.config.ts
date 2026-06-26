import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'figma-alpha-api.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: '*.figma.com' },
      { protocol: 'https', hostname: 's3-alpha-sig.figma.com' },
      { protocol: 'https', hostname: 's3-alpha.figma.com' },
    ],
  },
};

export default nextConfig;
