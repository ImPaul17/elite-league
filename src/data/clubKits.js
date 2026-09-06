export const KIT_SPLITS = [
  { id: "split-1", label: "Split 1" },
  { id: "split-2", label: "Split 2" },
  { id: "split-3", label: "Split 3" },
];

// Split 3 has one PNG per kit. Older splits are represented by the supplied
// composite image containing the local, visitor and goalkeeper kits together.
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

const FULL_KIT_CLUB_IDS = {
  "split-1": new Set([
    "bee-fc",
    "ca-coca-jrs",
    "cegatos-fc",
    "estaross-fc",
    "impuestos-fc",
    "lego-fc",
    "los-mugiwaras-fc",
    "maki-fc",
    "pico-fc",
    "playmobil-fc",
    "rayo-zeta",
    "urss-fc",
  ]),
  "split-2": new Set([
    "ca-coca-jrs",
    "cegatos-fc",
    "estaross-fc",
    "impuestos-fc",
    "lego-fc",
    "los-mugiwaras-fc",
    "los-pikas-fc",
    "maki-fc",
    "pico-fc",
    "playmobil-fc",
    "rayo-zeta",
    "urss-fc",
  ]),
};

const KIT_VARIANTS = [
  { id: "home", label: "Local" },
  { id: "away", label: "Visitante" },
  { id: "goalkeeper", label: "Portero" },
];

export function getClubKits(clubId, splitId = "split-3") {
  if (splitId === "split-1" || splitId === "split-2") {
    if (!FULL_KIT_CLUB_IDS[splitId]?.has(clubId)) return [];
    return [{
      id: "full",
      label: "Las tres equipaciones",
      src: `/clubs/kits/${splitId}/${clubId}-full.png`,
      width: splitId === "split-1" ? 1920 : 1468,
      height: 1080,
    }];
  }
  if (splitId !== "split-3" || !SPLIT_3_CLUB_IDS.has(clubId)) return [];
  return KIT_VARIANTS.map(({ id, label }) => ({
    id,
    label,
    src: `/clubs/kits/split-3/${clubId}-${id}.png`,
    width: 1080,
    height: 1920,
  }));
}
