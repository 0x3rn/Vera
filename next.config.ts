import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "firebase-admin", "@napi-rs/canvas"],
};

export default nextConfig;
