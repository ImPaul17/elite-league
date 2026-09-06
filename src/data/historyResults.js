import { getEditionGroups } from "./history.js";

const SPLIT_1_RESULTS = {
  matchdays: [
    [["pico-fc", 3, 2, "ca-coca-jrs"], ["estaross-fc", 1, 4, "rayo-zeta"], ["bee-fc", 1, 0, "lego-fc"], ["maki-fc", 1, 3, "cegatos-fc"], ["los-mugiwaras-fc", 1, 2, "playmobil-fc"], ["impuestos-fc", 0, 2, "urss-fc"]],
    [["rayo-zeta", 1, 0, "playmobil-fc"], ["ca-coca-jrs", 3, 1, "cegatos-fc"], ["pico-fc", 3, 0, "los-mugiwaras-fc"], ["impuestos-fc", 2, 1, "maki-fc"], ["lego-fc", 2, 0, "urss-fc"], ["estaross-fc", 0, 4, "bee-fc"]],
    [["cegatos-fc", 2, 2, "impuestos-fc", 1, 2], ["lego-fc", 1, 0, "rayo-zeta"], ["urss-fc", 0, 0, "bee-fc", 0, 1], ["playmobil-fc", 1, 4, "ca-coca-jrs"], ["los-mugiwaras-fc", 1, 2, "estaross-fc"], ["maki-fc", 1, 3, "pico-fc"]],
    [["cegatos-fc", 2, 3, "los-mugiwaras-fc"], ["rayo-zeta", 1, 0, "pico-fc"], ["urss-fc", 2, 1, "maki-fc"], ["lego-fc", 1, 0, "estaross-fc"], ["ca-coca-jrs", 1, 5, "impuestos-fc"], ["playmobil-fc", 0, 2, "bee-fc"]],
    [["bee-fc", 0, 3, "ca-coca-jrs"], ["estaross-fc", 3, 2, "impuestos-fc"], ["maki-fc", 1, 1, "lego-fc", 1, 2], ["pico-fc", 2, 0, "urss-fc"], ["los-mugiwaras-fc", 0, 1, "rayo-zeta"], ["cegatos-fc", 4, 1, "playmobil-fc"]],
    [["pico-fc", 4, 2, "estaross-fc"], ["lego-fc", 2, 0, "cegatos-fc"], ["rayo-zeta", 0, 3, "maki-fc"], ["impuestos-fc", 1, 0, "bee-fc"], ["playmobil-fc", 0, 3, "urss-fc"], ["ca-coca-jrs", 3, 2, "los-mugiwaras-fc"]],
    [["bee-fc", 1, 0, "cegatos-fc"], ["ca-coca-jrs", 2, 1, "urss-fc"], ["pico-fc", 1, 2, "lego-fc"], ["maki-fc", 0, 7, "los-mugiwaras-fc"], ["estaross-fc", 1, 2, "playmobil-fc"], ["impuestos-fc", 0, 2, "rayo-zeta"]],
    [["impuestos-fc", 1, 2, "pico-fc"], ["ca-coca-jrs", 2, 0, "estaross-fc"], ["maki-fc", 3, 2, "playmobil-fc"], ["bee-fc", 3, 1, "rayo-zeta"], ["urss-fc", 3, 1, "cegatos-fc"], ["lego-fc", 1, 1, "los-mugiwaras-fc", 0, 2]],
    [["cegatos-fc", 3, 0, "estaross-fc"], ["lego-fc", 2, 0, "impuestos-fc"], ["playmobil-fc", 2, 2, "pico-fc", 4, 3], ["maki-fc", 3, 1, "bee-fc"], ["urss-fc", 2, 2, "los-mugiwaras-fc", 2, 0], ["ca-coca-jrs", 2, 2, "rayo-zeta", 2, 1]],
    [["ca-coca-jrs", 2, 1, "lego-fc"], ["urss-fc", 3, 2, "rayo-zeta"], ["maki-fc", 3, 1, "estaross-fc"], ["pico-fc", 1, 0, "cegatos-fc"], ["impuestos-fc", 4, 1, "playmobil-fc"], ["bee-fc", 1, 2, "los-mugiwaras-fc"]],
    [["urss-fc", 3, 2, "estaross-fc"], ["maki-fc", 3, 4, "ca-coca-jrs"], ["los-mugiwaras-fc", 2, 1, "impuestos-fc"], ["playmobil-fc", 0, 2, "lego-fc"], ["bee-fc", 0, 4, "pico-fc"], ["cegatos-fc", 3, 1, "rayo-zeta"]],
  ],
  playoffs: {
    cuartos: [["ca-coca-jrs", 1, 1, "impuestos-fc", 3, 1], ["lego-fc", 0, 1, "rayo-zeta"], ["pico-fc", 1, 0, "los-mugiwaras-fc"], ["urss-fc", 3, 1, "bee-fc"]],
    semis: [["ca-coca-jrs", 2, 2, "rayo-zeta", 2, 3], ["pico-fc", 5, 3, "urss-fc"]],
    final: [["rayo-zeta", 2, 0, "pico-fc"]],
  },
};

const SPLIT_2_RESULTS = {
  matchdays: [
    [["pico-fc", 1, 0, "los-pikas-fc"], ["rayo-zeta", 0, 2, "ca-coca-jrs"], ["estaross-fc", 2, 2, "cegatos-fc", 1, 2], ["lego-fc", 2, 3, "urss-fc"], ["maki-fc", 2, 1, "los-mugiwaras-fc"], ["playmobil-fc", 0, 1, "impuestos-fc"]],
    [["ca-coca-jrs", 2, 1, "pico-fc"], ["los-mugiwaras-fc", 1, 2, "estaross-fc"], ["los-pikas-fc", 3, 0, "maki-fc"], ["impuestos-fc", 0, 0, "lego-fc", 3, 2], ["urss-fc", 4, 3, "rayo-zeta"], ["playmobil-fc", 0, 2, "cegatos-fc"]],
    [["ca-coca-jrs", 3, 2, "los-pikas-fc"], ["pico-fc", 4, 0, "urss-fc"], ["playmobil-fc", 1, 0, "los-mugiwaras-fc"], ["rayo-zeta", 1, 2, "impuestos-fc"], ["lego-fc", 2, 1, "cegatos-fc"], ["estaross-fc", 0, 2, "maki-fc"]],
    [["urss-fc", 5, 3, "ca-coca-jrs"], ["cegatos-fc", 0, 1, "rayo-zeta"], ["los-pikas-fc", 4, 2, "estaross-fc"], ["impuestos-fc", 2, 3, "pico-fc"], ["maki-fc", 3, 4, "playmobil-fc"], ["los-mugiwaras-fc", 3, 1, "lego-fc"]],
    [["los-pikas-fc", 4, 3, "urss-fc"], ["playmobil-fc", 3, 1, "estaross-fc"], ["rayo-zeta", 2, 2, "los-mugiwaras-fc", 2, 1], ["ca-coca-jrs", 2, 1, "impuestos-fc"], ["pico-fc", 0, 1, "cegatos-fc"], ["lego-fc", 4, 2, "maki-fc"]],
    [["cegatos-fc", 2, 1, "ca-coca-jrs"], ["estaross-fc", 2, 2, "lego-fc", 2, 3], ["los-mugiwaras-fc", 2, 4, "pico-fc"], ["maki-fc", 0, 2, "rayo-zeta"], ["impuestos-fc", 1, 4, "urss-fc"], ["los-pikas-fc", 2, 1, "playmobil-fc"]],
    [["pico-fc", 3, 4, "maki-fc"], ["impuestos-fc", 0, 1, "los-pikas-fc"], ["ca-coca-jrs", 2, 1, "los-mugiwaras-fc"], ["urss-fc", 0, 3, "cegatos-fc"], ["lego-fc", 0, 0, "playmobil-fc", 1, 2], ["rayo-zeta", 2, 2, "estaross-fc", 2, 1]],
    [["maki-fc", 1, 2, "ca-coca-jrs"], ["estaross-fc", 1, 7, "pico-fc"], ["los-mugiwaras-fc", 5, 1, "urss-fc"], ["playmobil-fc", 2, 8, "rayo-zeta"], ["los-pikas-fc", 0, 7, "lego-fc"], ["cegatos-fc", 3, 4, "impuestos-fc"]],
    [["playmobil-fc", 3, 3, "pico-fc", 1, 2], ["cegatos-fc", 2, 2, "los-pikas-fc", 2, 1], ["impuestos-fc", 6, 3, "los-mugiwaras-fc"], ["rayo-zeta", 0, 2, "lego-fc"], ["ca-coca-jrs", 1, 8, "estaross-fc"], ["urss-fc", 2, 6, "maki-fc"]],
    [["estaross-fc", 0, 5, "urss-fc"], ["playmobil-fc", 4, 2, "ca-coca-jrs"], ["rayo-zeta", 6, 2, "los-pikas-fc"], ["maki-fc", 2, 7, "impuestos-fc"], ["los-mugiwaras-fc", 0, 2, "cegatos-fc"], ["lego-fc", 0, 3, "pico-fc"]],
    [["ca-coca-jrs", 2, 4, "lego-fc"], ["los-pikas-fc", 2, 3, "los-mugiwaras-fc"], ["impuestos-fc", 2, 0, "estaross-fc"], ["urss-fc", 8, 3, "playmobil-fc"], ["pico-fc", 4, 2, "rayo-zeta"], ["cegatos-fc", 0, 6, "maki-fc"]],
  ],
  playoffs: {
    octavos: [["urss-fc", 4, 4, "playmobil-fc", 4, 3], ["ca-coca-jrs", 0, 4, "maki-fc"], ["rayo-zeta", 4, 2, "los-pikas-fc"]],
    cuartos: [["impuestos-fc", 2, 4, "urss-fc"], ["lego-fc", 1, 9, "maki-fc"], ["cegatos-fc", 1, 6, "rayo-zeta"]],
    semis: [["pico-fc", 6, 5, "urss-fc"], ["maki-fc", 2, 6, "rayo-zeta"]],
    final: [["pico-fc", 0, 1, "rayo-zeta"]],
  },
};

const ELITE_CUP_RESULTS = {
  matchdays: [
    {
      dateLabel: "13/01/2024",
      matches: [["playmobil-fc", 1, 7, "pico-fc"], ["cegatos-fc", 4, 2, "impuestos-fc"], ["estaross-fc", 3, 2, "maki-fc"], ["rayo-zeta", 3, 1, "los-pikas-fc"], ["urss-fc", 0, 1, "lego-fc"], ["los-mugiwaras-fc", 0, 3, "ca-coca-jrs"]],
    },
    {
      dateLabel: "13/01/2024",
      matches: [["impuestos-fc", 1, 3, "urss-fc"], ["pico-fc", 4, 1, "rayo-zeta"], ["maki-fc", 2, 1, "playmobil-fc"], ["lego-fc", 1, 5, "los-mugiwaras-fc"], ["cegatos-fc", 4, 2, "ca-coca-jrs"], ["los-pikas-fc", 1, 2, "estaross-fc"]],
    },
    {
      dateLabel: "21/01/2024",
      matches: [["impuestos-fc", 5, 2, "ca-coca-jrs"], ["maki-fc", 1, 0, "pico-fc"], ["cegatos-fc", 1, 2, "lego-fc"], ["estaross-fc", 6, 2, "rayo-zeta"], ["urss-fc", 0, 1, "los-mugiwaras-fc"], ["playmobil-fc", 0, 0, "los-pikas-fc", 2, 1]],
    },
    {
      dateLabel: "21/01/2024",
      matches: [["urss-fc", 0, 2, "ca-coca-jrs"], ["lego-fc", 4, 5, "impuestos-fc"], ["rayo-zeta", 2, 0, "playmobil-fc"], ["cegatos-fc", 0, 4, "los-mugiwaras-fc"], ["los-pikas-fc", 3, 4, "maki-fc"], ["estaross-fc", 1, 5, "pico-fc"]],
    },
    {
      dateLabel: "27/01/2024",
      matches: [["playmobil-fc", 1, 3, "estaross-fc"], ["lego-fc", 0, 6, "ca-coca-jrs"], ["cegatos-fc", 0, 4, "urss-fc"], ["maki-fc", 3, 2, "rayo-zeta"], ["pico-fc", 6, 3, "los-pikas-fc"], ["los-mugiwaras-fc", 2, 2, "impuestos-fc", 2, 3]],
    },
  ],
  playoffs: {
    cuartos: [["impuestos-fc", 3, 2, "rayo-zeta"], ["estaross-fc", 0, 2, "urss-fc"], ["los-mugiwaras-fc", 0, 2, "maki-fc"], ["pico-fc", 2, 0, "ca-coca-jrs"]],
    semis: [["impuestos-fc", 3, 4, "urss-fc"], ["maki-fc", 1, 3, "pico-fc"]],
    final: [["urss-fc", 3, 4, "pico-fc"]],
  },
};

const COMPETITION_RESULTS = {
  "split-1": SPLIT_1_RESULTS,
  "split-2": SPLIT_2_RESULTS,
  "elite-cup": ELITE_CUP_RESULTS,
};

const PLAYOFF_STAGE_LABELS = {
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semis: "Semifinales",
  final: "Final",
};

function makeMatch(editionId, rawMatch, { matchdayNumber = null, order, stage = null, dateLabel = null, groupId = null }) {
  const [homeClubId, homeScore, awayScore, awayClubId, homePenalties, awayPenalties] = rawMatch;
  const hasPenalties = Number.isFinite(homePenalties) && Number.isFinite(awayPenalties);
  return {
    id: `${editionId}-${stage ? `playoffs-${stage}` : `j${matchdayNumber}`}-m${order}`,
    homeClubId,
    awayClubId,
    matchdayNumber,
    order,
    stage,
    dateLabel,
    groupId,
    status: "confirmed",
    score: { home: homeScore, away: awayScore },
    penalties: hasPenalties ? { home: homePenalties, away: awayPenalties } : null,
  };
}

export function getHistoricCompetitionData(editionId, currentClubs) {
  const resultSource = COMPETITION_RESULTS[editionId];
  if (!resultSource) return null;

  const editionGroups = getEditionGroups(editionId, currentClubs);
  const clubs = editionGroups.flatMap((group) => group.clubs);
  const groupByClubId = Object.fromEntries(editionGroups.flatMap((group) => group.clubs.map((club) => [club.id, group.id])));
  const regularMatchdays = resultSource.matchdays.map((matchday, index) => {
    const matches = Array.isArray(matchday) ? matchday : matchday.matches;
    const dateLabel = Array.isArray(matchday) ? null : matchday.dateLabel ?? null;
    return {
      id: `${editionId}-j${index + 1}`,
      number: index + 1,
      title: `Jornada ${index + 1}`,
      dateLabel,
      status: "completed",
      matches: matches.map((match, matchIndex) => {
        const groupId = groupByClubId[match[0]] === groupByClubId[match[3]] ? groupByClubId[match[0]] : null;
        return makeMatch(editionId, match, { matchdayNumber: index + 1, order: matchIndex + 1, dateLabel, groupId });
      }),
    };
  });
  const regularMatches = regularMatchdays.flatMap((matchday) => matchday.matches);
  const groups = editionGroups.map((group) => ({
    ...group,
    regularMatches: regularMatches.filter((match) => match.groupId === group.id),
  }));
  const playoffStages = Object.entries(resultSource.playoffs).map(([stage, matches]) => ({
    id: stage,
    label: PLAYOFF_STAGE_LABELS[stage] ?? stage,
    matches: matches.map((match, matchIndex) => makeMatch(editionId, match, { stage: PLAYOFF_STAGE_LABELS[stage] ?? stage, order: matchIndex + 1 })),
  }));

  return {
    id: editionId,
    clubs,
    groups,
    regularMatchdays,
    regularMatches,
    playoffStages,
  };
}
