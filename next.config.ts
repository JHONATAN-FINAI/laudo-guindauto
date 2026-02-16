import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA será configurado na Fase 3
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
