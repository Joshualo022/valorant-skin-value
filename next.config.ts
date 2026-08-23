import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Custom passthrough loader (src/image-loader.ts) serves every image
    // straight from its origin instead of Vercel's optimizer — see that file
    // for the full rationale (Hobby-plan transformation budget vs. 1,344
    // already-small CDN-hosted skin images). This bypasses /_next/image
    // entirely, so `remotePatterns` below is now dormant (the optimizer's
    // host allow-list); it's kept as documentation of the external host and
    // so removing the custom loader restores a working config.
    loader: "custom",
    loaderFile: "./src/image-loader.ts",
    // Skin/weapon/chroma images are hosted by valorant-api.com's CDN, not
    // uploaded to this app — next/image requires external hosts to be
    // explicitly allow-listed (only enforced when the built-in optimizer is
    // in use).
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
      // /loadout moved under /collection/loadout (it's a tab of the
      // collection now, not its own top-level page) — not permanent in case
      // this route shape changes again.
      {
        source: "/loadout",
        destination: "/collection/loadout",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
