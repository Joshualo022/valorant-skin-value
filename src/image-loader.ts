// Custom next/image loader — returns the image URL untouched instead of
// routing it through Vercel's optimizer (/_next/image). Wired up via
// `images.loader: "custom"` + `images.loaderFile` in next.config.ts.
//
// Why: every image on this site is a fixed ~512px PNG already hosted on
// valorant-api.com's CDN. Optimizing 1,344 skins × ~11 requested widths would
// blow the Vercel Hobby plan's transformation budget many times over (and
// past the cap Vercel serves the unoptimized original anyway) — so we skip
// the optimizer entirely and let the browser fetch the original from
// valorant-api's CDN and scale it in CSS (every <Image> here uses `fill` +
// object-contain). Cost: no Vercel transformations, no Vercel image
// bandwidth; tradeoff: slightly larger (PNG, un-downscaled) but CDN-served
// and browser-cached downloads. See the security/perf discussion + SPEC notes.
//
// This still keeps next/image the *component* (lazy loading, fill layout,
// sizes, priority) — only the optimization step is bypassed. The whole thing
// is global: the couple of local assets (public/vp-icon.png) also serve
// as-is, which is fine since they're tiny. The OG image (opengraph-image.tsx)
// uses next/og, not next/image, so it's unaffected either way.
//
// If Vercel image optimization is ever wanted again for a subset (e.g. on a
// Pro plan, optimize only the large flex-hero images), branch here on `src`
// and return a `/_next/image?...` URL for that subset — this passthrough is
// the base case for that hybrid.

type ImageLoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src }: ImageLoaderArgs): string {
  return src;
}
