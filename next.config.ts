import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Skin/weapon/chroma images are hosted by valorant-api.com's CDN, not
    // uploaded to this app — next/image requires external hosts to be
    // explicitly allow-listed.
    remotePatterns: [new URL("https://media.valorant-api.com/**")],
  },
};

export default nextConfig;
