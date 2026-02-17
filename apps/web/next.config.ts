import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import nextPwa from "@ducanh2912/next-pwa";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiOrigin = process.env.API_INTERNAL_ORIGIN ?? "http://localhost:3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withPWA = nextPwa({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
    });

    return withPWA(baseConfig);
  }

  return baseConfig;
}
