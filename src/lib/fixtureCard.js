import { getMatchStatus, isOfficialResult } from "./leagueEngine.js";

function textLabel(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getFixtureClub(id, clubsById) {
  const suppliedClub = id != null && clubsById && Object.hasOwn(clubsById, id)
    ? clubsById[id]
    : null;
  const club = suppliedClub && typeof suppliedClub === "object" && !Array.isArray(suppliedClub)
    ? suppliedClub
    : null;
  if (!club) return { club: null, name: "Equipo por definir", href: null };

  return {
    club,
    name: textLabel(club.name) || "Equipo por definir",
    href: textLabel(club.profilePath) || `/equipos/${club.id ?? id}`,
  };
}

export function getFixtureCardModel(match = {}, clubsById = {}, { showMatchday = false, showDate = true } = {}) {
  const fixture = match && typeof match === "object" ? match : {};
  const home = getFixtureClub(fixture.homeClubId, clubsById);
  const away = getFixtureClub(fixture.awayClubId, clubsById);
  const status = getMatchStatus(fixture);
  const orderLabel = Number.isInteger(fixture.order) && fixture.order > 0
    ? `Partido ${String(fixture.order).padStart(2, "0")}`
    : "Partido";
  const roundLabel = textLabel(fixture.stage) || (
    showMatchday && Number.isInteger(fixture.matchdayNumber) && fixture.matchdayNumber > 0
      ? `Jornada ${fixture.matchdayNumber}`
      : ""
  );
  const dateLabel = showDate ? textLabel(fixture.dateLabel) : "";
  const hasResult = isOfficialResult(fixture);
  const homeScore = hasResult ? fixture.score.home : null;
  const awayScore = hasResult ? fixture.score.away : null;
  const penalties = hasResult && Number.isFinite(fixture.penalties?.home) && Number.isFinite(fixture.penalties?.away)
    ? { home: fixture.penalties.home, away: fixture.penalties.away }
    : null;
  const accessibleLabel = [
    orderLabel,
    roundLabel,
    dateLabel,
    `${home.name} contra ${away.name}`,
    status.label,
    hasResult ? `Resultado ${homeScore} a ${awayScore}` : "",
    penalties ? `Penaltis ${penalties.home} a ${penalties.away}` : "",
  ].filter(Boolean).join(". ");

  return { home, away, status, orderLabel, roundLabel, dateLabel, hasResult, homeScore, awayScore, penalties, accessibleLabel };
}
