// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  serverExternalPackages: [],

  transpilePackages: ["@react-email/render"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  logging: {
    incomingRequests: false,
  },
};

export default nextConfig;