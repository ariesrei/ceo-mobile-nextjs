import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets Operations (default .next) and Warranty (.next-warranty) run at once.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
