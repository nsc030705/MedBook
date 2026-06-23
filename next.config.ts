import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    // authInterrupts: true, // Uncomment when using NextAuth interrupts
  },
};

export default nextConfig;
