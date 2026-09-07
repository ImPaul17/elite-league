import { COMPETITION_RULES } from "../data/league.js";

const EMPTY_STATS = {
  played: 0,
  wins: 0,
  losses: 0,
  penaltyWins: 0,
  penaltyLosses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  form: [],
};

export function isOfficialResult(match) {
  return match.status === "confirmed" && Number.isFinite(match.score?.home) && Number.isFinite(match.score?.away);
}

export function withoutMatchResult(match) {
  return { ...match, status: "scheduled", score: null, penalties: null, resultPublishedAt: null };
}

export function getOfficialMatchEvents(events, matches) {
  const officialMatchIds = new Set(matches.filter(isOfficialResult).map((match) => match.id));
  return events.filter((event) => officialMatchIds.has(event.matchId));
}

export function getResultKind(match) {
  if (!isOfficialResult(match)) return null;
  if (match.score.home !== match.score.away) return "normal";
  if (Number.isFinite(match.penalties?.home) && Number.isFinite(match.penalties?.away) && match.penalties.home !== match.penalties.away) {
    return "penalties";
  }
  return "invalid";
}

function addForm(stats, code) {
  stats.form.push(code);
  if (stats.form.length > 5) stats.form.shift();
}

function applyNormalResult(homeStats, awayStats, homeScore, awayScore) {
  if (homeScore > awayScore) {
    homeStats.wins += 1;
    homeStats.points += COMPETITION_RULES.points.win;
    awayStats.losses += 1;
    addForm(homeStats, "W");
    addForm(awayStats, "L");
    return;
  }

  awayStats.wins += 1;
  awayStats.points += COMPETITION_RULES.points.win;
  homeStats.losses += 1;
  addForm(homeStats, "L");
  addForm(awayStats, "W");
}

function applyPenaltyResult(homeStats, awayStats, penalties) {
  if (penalties.home > penalties.away) {
    homeStats.penaltyWins += 1;
    homeStats.points += COMPETITION_RULES.points.penaltyWin;
    awayStats.penaltyLosses += 1;
    awayStats.points += COMPETITION_RULES.points.penaltyLoss;
    addForm(homeStats, "P+");
    addForm(awayStats, "P-");
    return;
  }

  awayStats.penaltyWins += 1;
  awayStats.points += COMPETITION_RULES.points.penaltyWin;
  homeStats.penaltyLosses += 1;
  homeStats.points += COMPETITION_RULES.points.penaltyLoss;
  addForm(homeStats, "P-");
  addForm(awayStats, "P+");
}

export function calculateStandings(clubs, matches) {
  const byClubId = Object.fromEntries(
    clubs.map((club) => [club.id, { club, ...EMPTY_STATS, form: [] }]),
  );

  matches.forEach((match) => {
    if (!isOfficialResult(match)) return;

    const homeStats = byClubId[match.homeClubId];
    const awayStats = byClubId[match.awayClubId];
    const kind = getResultKind(match);

    if (!homeStats || !awayStats || kind === "invalid") return;

    const { home, away } = match.score;
    homeStats.played += 1;
    awayStats.played += 1;
    homeStats.goalsFor += home;
    homeStats.goalsAgainst += away;
    awayStats.goalsFor += away;
    awayStats.goalsAgainst += home;

    if (kind === "normal") applyNormalResult(homeStats, awayStats, home, away);
    if (kind === "penalties") applyPenaltyResult(homeStats, awayStats, match.penalties);
  });

  return Object.values(byClubId)
    .map((entry) => ({ ...entry, goalDifference: entry.goalsFor - entry.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        b.wins - a.wins ||
        a.club.name.localeCompare(b.club.name, "es"),
    )
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

export function getMatchesThroughMatchday(matchdays, matchdayNumber) {
  const upperBound = Number.isFinite(matchdayNumber) ? matchdayNumber : Infinity;
  return matchdays
    .filter((matchday) => matchday.number <= upperBound)
    .flatMap((matchday) => matchday.matches);
}

export function calculateStandingsThroughMatchday(clubs, matchdays, matchdayNumber) {
  return calculateStandings(clubs, getMatchesThroughMatchday(matchdays, matchdayNumber));
}

export function calculatePlayerStatistics(players, events, clubsById = {}) {
  const rowsByPlayer = new Map(
    players.map((player) => [player.id, {
      player,
      club: clubsById[player.clubId] ?? null,
      goals: 0,
      assists: 0,
      mvps: 0,
      yellowCards: 0,
      blueCards: 0,
      redCards: 0,
    }]),
  );

  events.forEach((event) => {
    const row = rowsByPlayer.get(event.playerId);
    if (!row) return;
    if (event.eventType === "goal") row.goals += 1;
    if (event.eventType === "assist") row.assists += 1;
    if (event.eventType === "mvp") row.mvps += 1;
    if (event.eventType === "yellow_card") row.yellowCards += 1;
    if (event.eventType === "blue_card") row.blueCards += 1;
    if (event.eventType === "red_card") row.redCards += 1;
  });

  return [...rowsByPlayer.values()];
}

export function getStatisticLeaders(rows, key, limit = 5) {
  return rows
    .filter((row) => row[key] > 0)
    .sort((a, b) => b[key] - a[key] || a.player.name.localeCompare(b.player.name, "es"))
    .slice(0, limit);
}

export function flattenMatches(matchdays) {
  return matchdays.flatMap((matchday) => matchday.matches.map((match) => ({ ...match, matchday })));
}

export function getClubFixtures(matchdays, clubId) {
  return flattenMatches(matchdays).filter((match) => match.homeClubId === clubId || match.awayClubId === clubId);
}

export function getNextClubFixture(matchdays, clubId) {
  return getClubFixtures(matchdays, clubId).find((match) => !isOfficialResult(match)) ?? null;
}

export function getCurrentMatchday(matchdays, currentNumber) {
  return matchdays.find((matchday) => matchday.number === currentNumber) ?? matchdays[0] ?? null;
}

export function getMatchStatus(match) {
  if (match.status === "live") return { label: "En directo", tone: "live" };
  if (isOfficialResult(match)) return { label: "Finalizado", tone: "finished" };
  if (match.status === "reported") return { label: "Pendiente de validar", tone: "review" };
  return { label: "Por jugar", tone: "scheduled" };
}

export function getScoreLabel(match) {
  if (!isOfficialResult(match)) return "VS";
  const normal = `${match.score.home} – ${match.score.away}`;
  return match.penalties ? `${normal}  ·  P ${match.penalties.home}-${match.penalties.away}` : normal;
}

export function validateLineup({ players, clubId, matchId, matchdays }) {
  const selected = players.filter(Boolean);
  const unique = new Set(selected.map((player) => player.id));
  const goalkeepers = selected.filter((player) => player.positionGroup === "GK");
  const match = flattenMatches(matchdays).find((item) => item.id === matchId);

  if (!match) return "El partido seleccionado ya no existe.";
  if (match.homeClubId !== clubId && match.awayClubId !== clubId) return "La alineación no pertenece a este club.";
  if (selected.length !== COMPETITION_RULES.fieldPlayers + COMPETITION_RULES.goalkeepers) return "Selecciona exactamente cuatro jugadores de campo y un portero.";
  if (unique.size !== selected.length) return "Un jugador no puede ocupar dos posiciones.";
  if (goalkeepers.length !== COMPETITION_RULES.goalkeepers) return "La formación debe incluir exactamente un portero.";
  if (selected.some((player) => player.clubId !== clubId || player.status !== "active")) return "Todos los jugadores deben estar activos y registrados en el club.";
  return null;
}

export function matchHasStarted(match) {
  return Boolean(match.kickoff && new Date(match.kickoff).getTime() <= Date.now());
}
