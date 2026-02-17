import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import nextPwa from "@ducanh2912/next-pwa";

const baseConfig: NextConfig = {
  reactStrictMode: true,
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
