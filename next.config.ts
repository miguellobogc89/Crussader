// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  // clave para evitar el “Package prettier can't be external”
  serverExternalPackages: [],

  // por si acaso, transpilar este paquete
  transpilePackages: ["@react-email/render"],

  // 👇 AÑADIDO PARA PERMITIR FOTOS DE GOOGLE REVIEWS
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
