import { CLUBS_BY_ID, getClubLeadershipTitle } from "./league.js";

const publicBase = import.meta.env?.BASE_URL ?? "/";
const asset = (path) => `${publicBase}${path.replace(/^\//, "")}`;

const LEGACY_CLUBS = {
  "playmobil-fc": {
    id: "playmobil-fc",
    name: "Playmobil FC",
    shortName: "Playmobil",
    city: "",
    founded: "",
    founder: "Damián",
    leadershipTitle: "Expresidente",
    representativeColors: ["#4FB9F8"],
    honours: [],
  },
  "cegatos-fc": {
    id: "cegatos-fc",
    name: "Cegatos FC",
    shortName: "Cegatos",
    city: "",
    founded: "",
    founder: "M. Ángel",
    leadershipTitle: "Expresidente",
    representativeColors: ["#D8FE00"],
    honours: [],
  },
  "los-pikas-fc": {
    id: "los-pikas-fc",
    name: "Los Pikas FC",
    shortName: "Los Pikas",
    city: "",
    founded: "",
    founder: "Isma",
    leadershipTitle: "Expresidente",
    representativeColors: ["#FFB701"],
    honours: [],
  },
};

export const CLUB_CATALOG = { ...CLUBS_BY_ID, ...LEGACY_CLUBS };

const oldCrests = {
  pico: asset("/clubs/historical/pico-fc-s1.png"),
  urss: asset("/clubs/historical/urss-fc-s1.png"),
  mugiwaras: asset("/clubs/historical/los-mugiwaras-fc-s1.png"),
  lego: asset("/clubs/historical/lego-fc-s1.png"),
  rayo: asset("/clubs/historical/rayo-zeta-s1.png"),
  playmobilSplit1: asset("/clubs/historical/playmobil-fc-s1.png"),
  cegatosSplit1: asset("/clubs/historical/cegatos-fc-s1.png"),
  pikas: asset("/clubs/historical/los-pikas-fc-s2.png"),
  playmobilSplit2: asset("/clubs/historical/playmobil-fc-s2.png"),
  cegatosSplit2: asset("/clubs/historical/cegatos-fc-s2.png"),
};

const CLUB_CREST_ARCHIVES = {
  "pico-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Elite Cup", crest: oldCrests.pico }],
  "urss-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Split 1", crest: oldCrests.urss }],
  "los-mugiwaras-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Elite Cup", crest: oldCrests.mugiwaras }],
  "lego-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Elite Cup", crest: oldCrests.lego }],
  "rayo-zeta": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Elite Cup", crest: oldCrests.rayo }],
  "playmobil-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Split 1", crest: oldCrests.playmobilSplit1 }],
  "cegatos-fc": [{ id: "split-1", label: "Escudo anterior", from: "Split 1", until: "Split 1", crest: oldCrests.cegatosSplit1 }],
};

const CLUB_CURRENT_CREST_PERIODS = {
  "pico-fc": { from: "Split 3", until: "Actualidad" },
  "urss-fc": { from: "Split 2", until: "Actualidad" },
  "los-mugiwaras-fc": { from: "Split 3", until: "Actualidad" },
  "lego-fc": { from: "Split 3", until: "Actualidad" },
  "rayo-zeta": { from: "Split 3", until: "Actualidad" },
  "playmobil-fc": { from: "Split 2", until: "Elite Cup" },
  "cegatos-fc": { from: "Split 2", until: "Elite Cup" },
};

export function getClubCrestVersions(club) {
  if (!club?.crest) return [];

  const current = {
    id: "current",
    label: club.status === "inactive" ? "Último escudo" : "Escudo actual",
    ...(CLUB_CURRENT_CREST_PERIODS[club.id] ?? { from: "Actualidad", until: "Actualidad" }),
    crest: club.crest,
  };
  const historic = CLUB_CREST_ARCHIVES[club.id] ?? [];

  return [current, ...historic].filter(
    (version, index, versions) => versions.findIndex((candidate) => candidate.crest === version.crest) === index,
  );
}

const entry = (clubId, presentation = {}) => ({ clubId, status: "active", ...presentation });
const oldPico = () => entry("pico-fc", { crest: oldCrests.pico, color: "#344F34" });
const oldMugiwaras = () => entry("los-mugiwaras-fc", { crest: oldCrests.mugiwaras, color: "#BA1E1E" });
const oldLego = () => entry("lego-fc", { crest: oldCrests.lego, color: "#D67527" });
const oldRayo = () => entry("rayo-zeta", { crest: oldCrests.rayo, color: "#51B6B7" });
const inactivePlaymobil = (crest, color) => entry("playmobil-fc", { crest, color, status: "inactive", president: "Damián", leadershipTitle: "Expresidente" });
const inactiveCegatos = (crest, color) => entry("cegatos-fc", { crest, color, status: "inactive", president: "M. Ángel", leadershipTitle: "Expresidente" });
const inactivePikas = () => entry("los-pikas-fc", { crest: oldCrests.pikas, color: "#FFB701", status: "inactive", president: "Isma", leadershipTitle: "Expresidente" });

export const COMPETITION_EDITIONS = [
  {
    id: "split-1",
    label: "Split 1",
    type: "split",
    groups: [{
      id: "clubs",
      label: null,
      entries: [
        oldPico(),
        entry("ca-coca-jrs"),
        entry("urss-fc", { crest: oldCrests.urss, color: "#D8FE00" }),
        entry("bee-fc"),
        oldMugiwaras(),
        entry("impuestos-fc"),
        entry("maki-fc"),
        oldLego(),
        oldRayo(),
        entry("estaross-fc"),
        inactivePlaymobil(oldCrests.playmobilSplit1, "#2EADF8"),
        inactiveCegatos(oldCrests.cegatosSplit1, "#E90F37"),
      ],
    }],
  },
  {
    id: "split-2",
    label: "Split 2",
    type: "split",
    groups: [{
      id: "clubs",
      label: null,
      entries: [
        oldPico(),
        entry("ca-coca-jrs"),
        entry("urss-fc"),
        inactivePikas(),
        oldMugiwaras(),
        entry("impuestos-fc"),
        entry("maki-fc"),
        oldLego(),
        oldRayo(),
        entry("estaross-fc"),
        inactivePlaymobil(oldCrests.playmobilSplit2, "#4FB9F8"),
        inactiveCegatos(oldCrests.cegatosSplit2, "#D8FE00"),
      ],
    }],
  },
  {
    id: "elite-cup",
    label: "Elite Cup",
    type: "cup",
    groups: [
      {
        id: "group-a",
        label: "Grupo A",
        entries: [
          entry("ca-coca-jrs"),
          entry("urss-fc"),
          oldMugiwaras(),
          entry("impuestos-fc"),
          oldLego(),
          inactiveCegatos(oldCrests.cegatosSplit2, "#D8FE00"),
        ],
      },
      {
        id: "group-b",
        label: "Grupo B",
        entries: [
          oldPico(),
          inactivePikas(),
          entry("maki-fc"),
          oldRayo(),
          entry("estaross-fc"),
          inactivePlaymobil(oldCrests.playmobilSplit2, "#4FB9F8"),
        ],
      },
    ],
  },
  {
    id: "split-3",
    label: "Split 3",
    type: "split",
    isCurrent: true,
    groups: [{ id: "clubs", label: null, entries: [] }],
  },
];

const fallbackCurrentClubs = Object.values(CLUBS_BY_ID);

export function getCompetitionEdition(editionId) {
  return COMPETITION_EDITIONS.find((edition) => edition.id === editionId) ?? null;
}

function presentationForCurrentClub(edition, club) {
  return {
    ...club,
    clubId: club.id,
    historyKey: `${edition.id}-${club.id}`,
    profilePath: `/equipos/${club.id}`,
    status: "active",
    president: club.president ?? club.founder ?? "",
    leadershipTitle: getClubLeadershipTitle(club),
    editionId: edition.id,
    editionLabel: edition.label,
    editionType: edition.type,
    isHistorical: false,
  };
}

function presentationForHistoricClub(edition, group, item, currentClubs) {
  const currentClub = currentClubs.find((club) => club.id === item.clubId);
  const baseClub = currentClub ?? CLUB_CATALOG[item.clubId];
  if (!baseClub) return null;

  const president = item.president ?? baseClub.president ?? baseClub.founder ?? "";
  return {
    ...baseClub,
    ...item,
    id: item.clubId,
    founder: president,
    president,
    leadershipTitle: item.leadershipTitle ?? getClubLeadershipTitle(baseClub),
    representativeColors: item.representativeColors ?? (item.color ? [item.color] : baseClub.representativeColors ?? []),
    historyKey: `${edition.id}-${group.id}-${item.clubId}`,
    profilePath: `/equipos/${item.clubId}/${edition.id}`,
    editionId: edition.id,
    editionLabel: edition.label,
    editionType: edition.type,
    groupId: group.id,
    groupLabel: group.label,
    isHistorical: true,
  };
}

export function getEditionGroups(editionId, currentClubs = fallbackCurrentClubs) {
  const edition = getCompetitionEdition(editionId);
  if (!edition) return [];

  if (edition.isCurrent) {
    return edition.groups.map((group) => ({
      ...group,
      clubs: currentClubs.map((club) => presentationForCurrentClub(edition, club)),
    }));
  }

  return edition.groups.map((group) => ({
    ...group,
    clubs: group.entries
      .map((item) => presentationForHistoricClub(edition, group, item, currentClubs))
      .filter(Boolean),
  }));
}

export function getHistoricClub(editionId, clubId, currentClubs = fallbackCurrentClubs) {
  const edition = getCompetitionEdition(editionId);
  if (!edition || edition.isCurrent) return null;
  return getEditionGroups(editionId, currentClubs)
    .flatMap((group) => group.clubs)
    .find((club) => club.id === clubId) ?? null;
}

export function getClubProfile(clubId, currentClubs = fallbackCurrentClubs) {
  const currentClub = currentClubs.find((club) => club.id === clubId);
  if (currentClub) {
    return {
      ...currentClub,
      status: "active",
      president: currentClub.president ?? currentClub.founder ?? "",
      leadershipTitle: getClubLeadershipTitle(currentClub),
      profilePath: `/equipos/${clubId}`,
    };
  }

  const catalogClub = CLUB_CATALOG[clubId];
  if (!catalogClub) return null;

  const latestParticipation = [...COMPETITION_EDITIONS]
    .reverse()
    .flatMap((edition) => getEditionGroups(edition.id, currentClubs).flatMap((group) => group.clubs))
    .find((club) => club.id === clubId);

  if (!latestParticipation) return null;

  return {
    ...catalogClub,
    ...latestParticipation,
    id: clubId,
    status: "inactive",
    president: latestParticipation.president ?? catalogClub.president ?? catalogClub.founder ?? "",
    leadershipTitle: latestParticipation.leadershipTitle ?? getClubLeadershipTitle(catalogClub),
    profilePath: `/equipos/${clubId}`,
  };
}

export function getClubCompetitionEntries(clubId, currentClubs = fallbackCurrentClubs) {
  return COMPETITION_EDITIONS.flatMap((edition) => {
    if (edition.isCurrent) {
      const currentClub = currentClubs.find((club) => club.id === clubId);
      return currentClub ? [{ editionId: edition.id, label: edition.label, profilePath: `/equipos/${clubId}` }] : [];
    }

    const historicClub = getHistoricClub(edition.id, clubId, currentClubs);
    return historicClub
      ? [{ editionId: edition.id, label: edition.label, profilePath: historicClub.profilePath }]
      : [];
  });
}
