import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading the dev client from these hosts (e.g. your machine's LAN IP),
  // otherwise Next.js refuses to hydrate and forms fall back to a full reload.
  allowedDevOrigins: ["192.168.132.1"],
};

export default nextConfig;
