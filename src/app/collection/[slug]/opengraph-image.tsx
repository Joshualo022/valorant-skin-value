import { ImageResponse } from "next/og";
import { getSharedCollectionBySlug } from "@/lib/collection";

export const alt = "Valorant Skin Value — shared collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKGROUND = "linear-gradient(135deg, #0a0a0f 0%, #1c1220 55%, #0a0a0f 100%)";
const ACCENT = "#ff4d8f";
const FOREGROUND = "#f1f1f5";
const MUTED = "#8b8b96";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shared = await getSharedCollectionBySlug(slug);

  // Falls back to a bare wordmark card if the link was revoked between a
  // platform crawling it and someone actually clicking it.
  if (!shared) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BACKGROUND,
            color: FOREGROUND,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Valorant Skin Value
        </div>
      ),
      size
    );
  }

  const { displayName, collectionSize, totalValue, realisticValue } = shared;

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              borderRadius: 999,
              background: ACCENT,
            }}
          />
          <span style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2, color: ACCENT }}>
            VALORANT SKIN VALUE
          </span>
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

        <div style={{ display: "flex", gap: 64, marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 22, color: MUTED, textTransform: "uppercase" }}>
              Face value
            </span>
            <span style={{ display: "flex", fontSize: 44, fontWeight: 700, color: FOREGROUND }}>
              {totalValue.toLocaleString()} VP
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 22, color: MUTED, textTransform: "uppercase" }}>
              Realistic value
            </span>
            <span style={{ display: "flex", fontSize: 44, fontWeight: 700, color: FOREGROUND }}>
              {realisticValue.toLocaleString()} VP
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
