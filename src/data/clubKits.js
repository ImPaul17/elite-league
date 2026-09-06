export const KIT_SPLITS = [
  { id: "split-1", label: "Split 1" },
  { id: "split-2", label: "Split 2" },
  { id: "split-3", label: "Split 3" },
];

// Only clubs whose original Split 3 PNGs have been supplied are listed here.
const SPLIT_3_CLUB_IDS = new Set([
  "pico-fc",
  "ca-coca-jrs",
  "urss-fc",
  "bee-fc",
  "los-mugiwaras-fc",
  "impuestos-fc",
  "maki-fc",
  "lego-fc",
  "rayo-zeta",
  "estaross-fc",
  "karasuno-falcons",
  "el-caudillo-fc",
]);

const KIT_VARIANTS = [
  { id: "home", label: "Local" },
  { id: "away", label: "Visitante" },
  { id: "goalkeeper", label: "Portero" },
];

export function getClubKits(clubId, splitId = "split-3") {
  if (splitId !== "split-3" || !SPLIT_3_CLUB_IDS.has(clubId)) return [];
  return KIT_VARIANTS.map(({ id, label }) => ({
    id,
    label,
    src: `/clubs/kits/split-3/${clubId}-${id}.png`,
    width: 1080,
    height: 1920,
  }));
}
