import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Skin/weapon/chroma images are hosted by valorant-api.com's CDN, not
    // uploaded to this app — next/image requires external hosts to be
    // explicitly allow-listed.
    remotePatterns: [new URL("https://media.valorant-api.com/**")],
  },
  async redirects() {
    return [
      // www.myradianite.com is canonical — send apex-domain requests there,
      // preserving path and query string. 308 (permanent: true) tells
      // browsers/search engines to remember this rather than re-check it
      // on every visit.
      {
        source: "/:path*",
        has: [{ type: "host", value: "myradianite.com" }],
        destination: "https://www.myradianite.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
