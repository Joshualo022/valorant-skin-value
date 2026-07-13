import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSharedCollectionBySlug } from "@/lib/collection";

export const alt = "Valorant Skin Value — profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKGROUND = "linear-gradient(135deg, #0a0a0f 0%, #1c1220 55%, #0a0a0f 100%)";
const ACCENT = "#ff4d8f";
const FOREGROUND = "#f1f1f5";
const MUTED = "#8b8b96";
const DOMAIN = "myradianite.com";

// Mirrors src/lib/tier-style.ts's rarity gradient, but as raw hex — next/og
// renders via Satori (not a browser), which doesn't read Tailwind classes,
// so the OG image needs its own copy of these colors. Tinting the card by
// the flex item's tier gives each person's shared card a distinct look
// instead of every card sharing the same accent color.
const TIER_OG_COLORS: Record<string, string> = {
  Select: "#a1a1aa",
  Deluxe: "#38bdf8",
  Premium: "#c084fc",
  Exclusive: "#f472b6",
  Ultra: "#fcd34d",
};

function DomainTag() {
  return (
    <span style={{ display: "flex", fontSize: 20, fontWeight: 600, color: MUTED, letterSpacing: 0.5 }}>
      {DOMAIN}
    </span>
  );
}

// Node.js runtime (the default here, since this file doesn't opt into the
// edge runtime) can read /public straight off disk — see the "Using Node.js
// runtime with local assets" pattern in Next's own opengraph-image docs.
// Same static asset VpAmount uses client-side; Satori just needs it as a
// data URI instead of a next/image src.
async function loadVpIconDataUri(): Promise<string> {
  const bytes = await readFile(join(process.cwd(), "public", "vp-icon.png"), "base64");
  return `data:image/png;base64,${bytes}`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [shared, vpIconSrc] = await Promise.all([getSharedCollectionBySlug(slug), loadVpIconDataUri()]);

  // Falls back to a bare wordmark card if the link was revoked between a
  // platform crawling it and someone actually clicking it, or if this
  // profile's collection is private.
  if (!shared) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: BACKGROUND,
            color: FOREGROUND,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          <span style={{ display: "flex" }}>Valorant Skin Value</span>
          <DomainTag />
        </div>
      ),
      size
    );
  }

  const { displayName, collectionSize, totalValue, loadoutValuation, flexItem } = shared;
  const accent = flexItem ? TIER_OG_COLORS[flexItem.contentTier.name] ?? ACCENT : ACCENT;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 72,
          background: BACKGROUND,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {flexItem && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: -60,
              top: 0,
              bottom: 0,
              width: 680,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og's Satori renderer needs a plain <img>, not next/image */}
            <img
              src={flexItem.imageUrl}
              alt=""
              width={640}
              height={420}
              style={{ objectFit: "contain", opacity: 0.55 }}
            />
          </div>
        )}
        {flexItem && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              background: `linear-gradient(100deg, #0a0a0f 0%, #0a0a0fcc 42%, ${accent}22 65%, transparent 100%)`,
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 40,
                height: 40,
                borderRadius: 999,
                background: accent,
              }}
            />
            <span style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2, color: accent }}>
              VALORANT SKIN VALUE
            </span>
          </div>
          <DomainTag />
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: FOREGROUND,
            marginTop: 36,
            maxWidth: 1000,
          }}
        >
          {displayName}&apos;s Collection
        </div>
        <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 14 }}>
          See my collection and reviews →
        </div>

        <div style={{ display: "flex", gap: 64, marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 22, color: MUTED, textTransform: "uppercase" }}>
              Collection value
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 44, fontWeight: 700, color: FOREGROUND }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- next/og's Satori renderer needs a plain <img>, not next/image */}
              <img src={vpIconSrc} alt="" width={38} height={38} />
              {totalValue.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 22, color: MUTED, textTransform: "uppercase" }}>
              Loadout valuation
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 44, fontWeight: 700, color: FOREGROUND }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- next/og's Satori renderer needs a plain <img>, not next/image */}
              <img src={vpIconSrc} alt="" width={38} height={38} />
              {loadoutValuation.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 22, color: MUTED, textTransform: "uppercase" }}>
              Skins owned
            </span>
            <span style={{ display: "flex", fontSize: 44, fontWeight: 700, color: FOREGROUND }}>
              {collectionSize}
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
