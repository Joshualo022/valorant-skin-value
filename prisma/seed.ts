// Re-runnable seed script (SPEC.md section 8): pulls weapons, skins, skin
// lines (Riot calls them "themes"), and chromas from valorant-api.com and
// upserts them, so re-running after a new Act adds new skins without
// duplicating existing ones. Content tier VP pricing is hand-maintained
// separately (see seed-data/content-tier-prices.ts) since Riot's API doesn't
// expose real-money/VP pricing. A final pass (setMeleeOverrides) fills in
// Skin.vpPriceOverride for melee skins, whose real price diverges from their
// tier's gun-skin price.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { CONTENT_TIER_VP_PRICES } from "./seed-data/content-tier-prices";

const VALORANT_API_BASE = "https://valorant-api.com/v1";

interface ApiContentTier {
  uuid: string;
  devName: string;
  displayIcon: string;
}

interface ApiTheme {
  uuid: string;
  displayName: string;
}

interface ApiChroma {
  displayName: string;
  displayIcon: string | null;
  fullRender: string | null;
  swatch: string | null;
}

interface ApiSkin {
  uuid: string;
  displayName: string;
  themeUuid: string;
  contentTierUuid: string | null;
  displayIcon: string | null;
  chromas: ApiChroma[];
}

interface ApiWeapon {
  uuid: string;
  displayName: string;
  category: string;
  killfeedIcon: string | null;
  skins: ApiSkin[];
}

async function fetchData<T>(path: string): Promise<T> {
  const res = await fetch(`${VALORANT_API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`valorant-api.com request failed: ${path} (${res.status})`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

// Riot's category is like "EEquippableCategory::Heavy" -> we just want "heavy".
function weaponTypeFromCategory(category: string): string {
  return category.split("::").pop()!.toLowerCase();
}

function pickImageUrl(...candidates: (string | null | undefined)[]): string {
  const found = candidates.find((c) => !!c);
  if (!found) throw new Error("No usable image URL found among candidates");
  return found;
}

// Some chroma names embed a literal line break, e.g.
// "Reaver Odin Level 4\r\n(Variant 1 Red)" — collapse to a single line.
function cleanName(name: string): string {
  return name.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

async function main() {
  console.log("Fetching source data from valorant-api.com...");
  const [weapons, contentTiers, themes] = await Promise.all([
    fetchData<ApiWeapon[]>("/weapons"),
    fetchData<ApiContentTier[]>("/contenttiers"),
    fetchData<ApiTheme[]>("/themes"),
  ]);

  const themeNameByUuid = new Map(themes.map((t) => [t.uuid, t.displayName]));
  const tierDevNameByUuid = new Map(contentTiers.map((t) => [t.uuid, t.devName]));

  // --- Content tiers: 5 fixed rows; VP price comes from our own hand-maintained map ---
  const tierIdByDevName = new Map<string, string>();
  for (const tier of contentTiers) {
    const vpPrice = CONTENT_TIER_VP_PRICES[tier.devName];
    if (vpPrice === undefined) {
      throw new Error(`No VP price configured for content tier "${tier.devName}"`);
    }
    const row = await prisma.contentTier.upsert({
      where: { name: tier.devName },
      update: { vpPrice, iconUrl: tier.displayIcon },
      create: { name: tier.devName, vpPrice, iconUrl: tier.displayIcon },
    });
    tierIdByDevName.set(tier.devName, row.id);
  }
  console.log(`Seeded ${tierIdByDevName.size} content tiers.`);

  // --- Weapons ---
  const weaponIdByRiotUuid = new Map<string, string>();
  for (const weapon of weapons) {
    const row = await prisma.weapon.upsert({
      where: { name: weapon.displayName },
      update: {
        weaponType: weaponTypeFromCategory(weapon.category),
        killfeedIconUrl: weapon.killfeedIcon,
      },
      create: {
        name: weapon.displayName,
        weaponType: weaponTypeFromCategory(weapon.category),
        killfeedIconUrl: weapon.killfeedIcon,
      },
    });
    weaponIdByRiotUuid.set(weapon.uuid, row.id);
  }
  console.log(`Seeded ${weaponIdByRiotUuid.size} weapons.`);

  // --- Skins + skin lines (created lazily, one per referenced theme) + chromas ---
  const skinLineIdByThemeUuid = new Map<string, string>();
  let skinCount = 0;
  let chromaCount = 0;

  for (const weapon of weapons) {
    const weaponId = weaponIdByRiotUuid.get(weapon.uuid)!;

    for (const skin of weapon.skins) {
      // Base/stock weapon skins (free, not purchasable) have no content
      // tier — out of scope, since this app only tracks purchasable skins.
      if (!skin.contentTierUuid) continue;

      const tierDevName = tierDevNameByUuid.get(skin.contentTierUuid);
      const contentTierId = tierDevName ? tierIdByDevName.get(tierDevName) : undefined;
      if (!contentTierId) {
        throw new Error(`Unknown content tier for skin "${skin.displayName}"`);
      }

      let skinLineId = skinLineIdByThemeUuid.get(skin.themeUuid);
      if (!skinLineId) {
        const themeName = themeNameByUuid.get(skin.themeUuid) ?? "Unknown";
        const skinLine = await prisma.skinLine.upsert({
          where: { name: themeName },
          update: {},
          create: { name: themeName },
        });
        skinLineId = skinLine.id;
        skinLineIdByThemeUuid.set(skin.themeUuid, skinLineId);
      }

      const imageUrl = pickImageUrl(
        skin.displayIcon,
        skin.chromas[0]?.displayIcon,
        skin.chromas[0]?.fullRender
      );

      const skinRow = await prisma.skin.upsert({
        where: { riotContentId: skin.uuid },
        update: { name: skin.displayName, weaponId, skinLineId, contentTierId, imageUrl },
        create: {
          name: skin.displayName,
          weaponId,
          skinLineId,
          contentTierId,
          imageUrl,
          riotContentId: skin.uuid,
        },
      });
      skinCount++;

      for (const chroma of skin.chromas) {
        const chromaImageUrl = pickImageUrl(chroma.displayIcon, chroma.fullRender);
        const chromaName = cleanName(chroma.displayName);
        await prisma.chroma.upsert({
          where: { skinId_name: { skinId: skinRow.id, name: chromaName } },
          update: { imageUrl: chromaImageUrl, swatchUrl: chroma.swatch },
          create: {
            skinId: skinRow.id,
            name: chromaName,
            imageUrl: chromaImageUrl,
            swatchUrl: chroma.swatch,
          },
        });
        chromaCount++;
      }
    }
  }

  console.log(
    `Seeded ${skinCount} skins across ${skinLineIdByThemeUuid.size} skin lines, ${chromaCount} chromas.`
  );

  await setMeleeOverrides();
}

// Content tier VP price is tuned for gun skins. Melee skins in the same
// skin line cost roughly 2x the gun tier's price instead, so they need a
// per-skin vpPriceOverride rather than trusting the tier price (see
// Skin.vpPriceOverride and src/lib/pricing.ts).
const MELEE_HEURISTIC_TIERS = new Set(["Select", "Deluxe", "Premium", "Ultra"]);

async function setMeleeOverrides() {
  const meleeWeapon = await prisma.weapon.findUnique({ where: { name: "Melee" } });
  if (!meleeWeapon) {
    console.warn('No weapon named "Melee" found — skipping melee price override pass.');
    return;
  }

  const meleeSkins = await prisma.skin.findMany({ where: { weaponId: meleeWeapon.id } });

  const setViaHeuristic: { name: string; price: number }[] = [];
  const needsManual: string[] = [];

  for (const meleeSkin of meleeSkins) {
    // Non-null and non-zero means this was already priced (by a previous
    // heuristic run or by hand) — skip it so re-seeding after a new Act
    // never clobbers a manual entry. A stored 0 is not "priced" yet, so it's
    // retried every run in case sibling data has since appeared.
    if (meleeSkin.vpPriceOverride !== null && meleeSkin.vpPriceOverride !== 0) {
      continue;
    }

    let override = 0;

    if (meleeSkin.skinLineId) {
      const siblings = await prisma.skin.findMany({
        where: { skinLineId: meleeSkin.skinLineId, weaponId: { not: meleeWeapon.id } },
        include: { contentTier: true },
      });

      if (siblings.length > 0 && MELEE_HEURISTIC_TIERS.has(siblings[0].contentTier.name)) {
        override = siblings[0].contentTier.vpPrice * 2;
      }
    }

    await prisma.skin.update({
      where: { id: meleeSkin.id },
      data: { vpPriceOverride: override },
    });

    if (override > 0) {
      setViaHeuristic.push({ name: meleeSkin.name, price: override });
    } else {
      needsManual.push(meleeSkin.name);
    }
  }

  console.log(`Set ${setViaHeuristic.length} melee price override(s) via the 2x tier heuristic:`);
  for (const { name, price } of setViaHeuristic) {
    console.log(`  - ${name}: ${price} VP`);
  }

  console.log(`${needsManual.length} melee skin(s) landed at 0 VP and need manual pricing:`);
  for (const name of needsManual) {
    console.log(`  - ${name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
