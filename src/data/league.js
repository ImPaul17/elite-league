import { CURRENT_MATCHDAY, RESULTS_VISIBLE, SPLIT_3_MATCHDAYS } from "./split3.js";

const publicBase = import.meta.env?.BASE_URL ?? "/";
const asset = (path) => `${publicBase}${path.replace(/^\//, "")}`;

export const CLUBS = [
  { id: "pico-fc", name: "Pico FC", shortName: "Pico", crest: asset("/clubs/512/pico-fc.webp"), cardArt: asset("/clubs/cards/pico-fc-current.png"), color: "#1a9d40", city: "Madrid", founded: "2023", founder: "Pablo", representativeColors: ["#1a9d40"], honours: ["Campeón: Liga 2º Split", "Campeón: 1ª edición de la Elite Cup"] },
  { id: "ca-coca-jrs", name: "CA Coca Jrs", shortName: "Coca", crest: asset("/clubs/512/ca-coca-jrs.webp"), color: "#103f79", city: "Madrid", founded: "2023", founder: "Álvaro S.", representativeColors: ["#103f79", "#f3b229"], honours: ["Campeón: Liga 1º Split"] },
  { id: "urss-fc", name: "URSS FC", shortName: "URSS", crest: asset("/clubs/512/urss-fc.webp"), color: "#e80e37", city: "Madrid", founded: "2023", founder: "Juan", representativeColors: ["#e80e37", "#f6cb22"], honours: [] },
  { id: "bee-fc", name: "BEE FC", shortName: "BEE", crest: asset("/clubs/512/bee-fc.webp"), color: "#ffffff", city: "Madrid", founded: "2023", founder: "Bea", leadershipTitle: "Presidenta", representativeColors: ["#ffffff", "#ceb633"], honours: [] },
  { id: "los-mugiwaras-fc", name: "Los Mugiwaras FC", shortName: "Mugiwaras", crest: asset("/clubs/512/los-mugiwaras-fc.webp"), color: "#b01515", city: "Madrid", founded: "2023", founder: "Dani R.", representativeColors: ["#b01515", "#1b1f31"], honours: [] },
  { id: "impuestos-fc", name: "Impuestos FC", shortName: "Impuestos", crest: asset("/clubs/512/impuestos-fc.webp"), color: "#f2ea42", city: "Madrid", founded: "2023", founder: "Alfonso", representativeColors: ["#f2ea42"], honours: [] },
  { id: "maki-fc", name: "Maki FC", shortName: "Maki", crest: asset("/clubs/512/maki-fc.webp"), color: "#e25211", city: "Madrid", founded: "2023", founder: "Maki", representativeColors: ["#e25211"], honours: [] },
  { id: "lego-fc", name: "Lego FC", shortName: "Lego", crest: asset("/clubs/512/lego-fc.webp"), color: "#e47f00", city: "Madrid", founded: "2023", founder: "Adrián", representativeColors: ["#e47f00"], honours: [] },
  { id: "rayo-zeta", name: "Rayo Zeta", shortName: "Rayo", crest: asset("/clubs/512/rayo-zeta.webp"), color: "#51b6b7", city: "Madrid", founded: "2023", founder: "Álvaro G.", representativeColors: ["#51b6b7", "#000000"], honours: ["Campeón: Play-Offs del 1º Split", "Campeón: Play-Offs del 2º Split"] },
  { id: "estaross-fc", name: "Estaross FC", shortName: "Estaross", crest: asset("/clubs/512/estaross-fc.webp"), color: "#931dd7", city: "Madrid", founded: "2023", founder: "Pedro", representativeColors: ["#931dd7", "#000000"], honours: [] },
  { id: "karasuno-falcons", name: "Karasuno Falcons", shortName: "Karasuno", crest: asset("/clubs/512/karasuno-falcons.webp"), color: "#ea7118", city: "Madrid", founded: "2025", founder: "Isaac", representativeColors: ["#ea7118", "#101010"], honours: [] },
  { id: "el-caudillo-fc", name: "El Caudillo FC", shortName: "Caudillo", crest: asset("/clubs/512/el-caudillo-fc.webp"), color: "#9a1e15", city: "Madrid", founded: "2025", founder: "Dani D.", representativeColors: ["#9a1e15", "#dcae3e"], honours: [] },
];

export const CLUBS_BY_ID = Object.fromEntries(CLUBS.map((club) => [club.id, club]));
export const CLUBS_BY_NAME = Object.fromEntries(CLUBS.map((club) => [club.name, club]));

export const SEASON = {
  id: "elite-league-split-3",
  name: "Elite League",
  split: "Split 3",
  status: "upcoming",
  currentMatchday: CURRENT_MATCHDAY,
  resultsVisible: RESULTS_VISIBLE,
  competitionNotice: "Calendario oficial · resultados pendientes de publicación",
};

export const COMPETITION_RULES = {
  fieldPlayers: 4,
  goalkeepers: 1,
  points: {
    win: 3,
    penaltyWin: 2,
    penaltyLoss: 1,
    loss: 0,
  },
  tiebreakers: ["Puntos", "Diferencia de goles", "Goles a favor", "Victorias", "Nombre del club"],
  playoff: {
    label: "Formato configurable por temporada",
    note: "El formato histórico de Split 3 contempla un play-in entre 10.º y 11.º. Se mantendrá editable desde administración.",
  },
};

function makeMatchdayDate(number) {
  return number === CURRENT_MATCHDAY ? "Por anunciar" : "Fecha pendiente";
}

export const MATCHDAYS = SPLIT_3_MATCHDAYS.map((matchday) => ({
  id: `split-3-j${matchday.number}`,
  number: matchday.number,
  date: matchday.date ?? makeMatchdayDate(matchday.number),
  scheduledAt: null,
  status: matchday.number === CURRENT_MATCHDAY ? "current" : "scheduled",
  matches: matchday.matches.map((match, index) => ({
    id: `split-3-j${matchday.number}-m${index + 1}`,
    matchdayId: `split-3-j${matchday.number}`,
    matchdayNumber: matchday.number,
    order: index + 1,
    homeClubId: CLUBS_BY_NAME[match.home]?.id,
    awayClubId: CLUBS_BY_NAME[match.away]?.id,
    status: match.status === "completed" ? "confirmed" : match.status ?? "scheduled",
    score: match.score ? { home: match.score.home, away: match.score.away } : null,
    penalties: match.penalties ? { home: match.penalties.home, away: match.penalties.away } : null,
    kickoff: null,
    lineupDeadline: null,
    resultPublishedAt: null,
  })),
}));

export const DEMO_NEWS = [
  {
    id: "split-3-countdown",
    category: "Competición",
    date: "Próximamente",
    title: "Todo listo para el inicio del Split 3",
    excerpt: "Los doce clubes ya conocen su calendario. La jornada inaugural abrirá una nueva etapa de Elite League.",
    featured: true,
  },
  {
    id: "clubs-ready",
    category: "Clubes",
    date: "Actualidad",
    title: "Las plantillas se preparan para la temporada",
    excerpt: "Cada presidente podrá registrar jugadores y enviar su formación 4+1 desde el área privada del club.",
    featured: false,
  },
  {
    id: "rules-center",
    category: "Reglamento",
    date: "Oficial",
    title: "La competición estrena un centro de reglamento",
    excerpt: "Puntuación, sistema de eliminatorias y normativa quedarán publicados de forma centralizada.",
    featured: false,
  },
];

export const INITIAL_LEAGUE_STATE = {
  season: SEASON,
  clubs: CLUBS,
  matchdays: MATCHDAYS,
  players: [],
  lineups: [],
  matchEvents: [],
  news: DEMO_NEWS,
  auditEvents: [],
};

export function createLeagueSeed() {
  return JSON.parse(JSON.stringify(INITIAL_LEAGUE_STATE));
}

export function getClubBySlug(slug) {
  return CLUBS_BY_ID[slug] ?? null;
}

export function getClubLeadershipTitle(club) {
  return club?.leadershipTitle ?? "Presidente";
}
