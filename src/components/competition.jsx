import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { COMPETITION_EDITIONS, getClubCompetitionEntries } from "../data/history";
import { getClubLeadershipTitle } from "../data/league";
import { AppLink, ClubCrest, EmptyState, StatusBadge } from "./ui";
import { useLeague } from "../context/LeagueContext";
import { getMatchStatus, isOfficialResult } from "../lib/leagueEngine";
import { getFixtureCardModel } from "../lib/fixtureCard";
import "./fixture-card.css";

const publicAsset = (path) => `${import.meta.env?.BASE_URL ?? "/"}${path.replace(/^\//, "")}`;
const DIRECTORY_CARD_ART_PREVIEW = publicAsset("/clubs/cards/pico-fc-current.png");
const DIRECTORY_CARD_ARTS = {
  "pico-fc": {
    "split-1": publicAsset("/clubs/cards/pico-fc-old.png"),
    "split-2": publicAsset("/clubs/cards/pico-fc-old.png"),
    "elite-cup": publicAsset("/clubs/cards/pico-fc-old.png"),
    "split-3": publicAsset("/clubs/cards/pico-fc-current.png"),
  },
  "ca-coca-jrs": {
    fallback: publicAsset("/clubs/cards/ca-coca-jrs.png"),
  },
  "urss-fc": {
    "split-1": publicAsset("/clubs/cards/urss-fc-old.png"),
    fallback: publicAsset("/clubs/cards/urss-fc-current.png"),
  },
  "cegatos-fc": {
    "split-1": publicAsset("/clubs/cards/cegatos-fc-old.png"),
    fallback: publicAsset("/clubs/cards/cegatos-fc-current.png"),
  },
  "el-caudillo-fc": {
    fallback: publicAsset("/clubs/cards/el-caudillo-fc.png"),
  },
  "bee-fc": {
    fallback: publicAsset("/clubs/cards/bee-fc.png"),
  },
  "estaross-fc": {
    fallback: publicAsset("/clubs/cards/estaross-fc.png"),
  },
  "los-mugiwaras-fc": {
    "split-1": publicAsset("/clubs/cards/los-mugiwaras-fc-old.png"),
    "split-2": publicAsset("/clubs/cards/los-mugiwaras-fc-old.png"),
    "elite-cup": publicAsset("/clubs/cards/los-mugiwaras-fc-old.png"),
    fallback: publicAsset("/clubs/cards/los-mugiwaras-fc-current.png"),
  },
  "impuestos-fc": {
    fallback: publicAsset("/clubs/cards/impuestos-fc.png"),
  },
  "karasuno-falcons": {
    fallback: publicAsset("/clubs/cards/karasuno-falcons.png"),
  },
  "lego-fc": {
    "split-1": publicAsset("/clubs/cards/lego-fc-old.png"),
    "split-2": publicAsset("/clubs/cards/lego-fc-old.png"),
    "elite-cup": publicAsset("/clubs/cards/lego-fc-old.png"),
    fallback: publicAsset("/clubs/cards/lego-fc-current.png"),
  },
  "los-pikas-fc": {
    fallback: publicAsset("/clubs/cards/los-pikas-fc.png"),
  },
  "maki-fc": {
    fallback: publicAsset("/clubs/cards/maki-fc.png"),
  },
  "playmobil-fc": {
    "split-1": publicAsset("/clubs/cards/playmobil-fc-old.png"),
    fallback: publicAsset("/clubs/cards/playmobil-fc-current.png"),
  },
  "rayo-zeta": {
    "split-1": publicAsset("/clubs/cards/rayo-zeta-old.png"),
    "split-2": publicAsset("/clubs/cards/rayo-zeta-old.png"),
    "elite-cup": publicAsset("/clubs/cards/rayo-zeta-old.png"),
    fallback: publicAsset("/clubs/cards/rayo-zeta-current.png"),
  },
};

function getDirectoryEditionId(selectedEdition) {
  return COMPETITION_EDITIONS.find((edition) => selectedEdition === edition.id || selectedEdition.startsWith(`${edition.id}-`))?.id;
}

function getDirectoryCardArt(club, selectedEdition) {
  const artByEdition = DIRECTORY_CARD_ARTS[club.id];
  if (!artByEdition) return club.cardArt ?? DIRECTORY_CARD_ART_PREVIEW;

  const editionId = getDirectoryEditionId(selectedEdition);
  return artByEdition[editionId] ?? artByEdition.fallback ?? club.cardArt ?? DIRECTORY_CARD_ART_PREVIEW;
}

const OFFICIAL_STANDINGS_COLUMNS = [
  { label: "PG", key: "wins", x: 53.23, description: "Victorias" },
  { label: "PP", key: "losses", x: 58.27, description: "Derrotas" },
  { label: "PG (P)", key: "penaltyWins", x: 64.43, description: "Victorias por penaltis" },
  { label: "PP (P)", key: "penaltyLosses", x: 70.8, description: "Derrotas por penaltis" },
  { label: "GF", key: "goalsFor", x: 76.93, description: "Goles a favor" },
  { label: "GC", key: "goalsAgainst", x: 81.9, description: "Goles en contra" },
  { label: "DG", key: "goalDifference", x: 86.93, description: "Diferencia de goles" },
  { label: "PTS", key: "points", x: 92, description: "Puntos" },
];

const OFFICIAL_STANDINGS_CONFIGS = {
  "split-1": {
    background: "/psd/tabla-clasificacion-bg-1-split.png",
    width: 3000,
    height: 2687,
    rows: 12,
    headingTop: 110,
    rowTop: 214,
    rowStep: 188,
    rowHeight: 191,
  },
  "split-2": {
    background: "/psd/tabla-clasificacion-bg-2-split.png",
    width: 3000,
    height: 2687,
    rows: 12,
    headingTop: 110,
    rowTop: 214,
    rowStep: 188,
    rowHeight: 191,
  },
  "split-3": {
    background: "/psd/tabla-clasificacion-bg.png",
    width: 3000,
    height: 2687,
    rows: 12,
    headingTop: 110,
    rowTop: 214,
    rowStep: 188,
    rowHeight: 191,
  },
  "elite-cup": {
    background: "/psd/tabla-clasificacion-bg-elite-cup.png",
    width: 3000,
    height: 1559,
    rows: 6,
    headingTop: 110,
    rowTop: 214,
    rowStep: 188,
    rowHeight: 191,
  },
};

const MATCHDAY_ROW_POSITIONS = [313, 480.5, 647.5, 814.5, 981.5, 1148.5];
const SPLIT3_PLAYOFF_ROW_POSITIONS = [313, 636.5, 803.5, 970.5, 1293.5, 1460.5, 1627.5, 1951.5, 2118.5, 2443.5];

function useClubsById() {
  const { league } = useLeague();
  return useMemo(() => Object.fromEntries(league.clubs.map((club) => [club.id, club])), [league.clubs]);
}

function clubProfilePath(club) {
  return club?.profilePath ?? (club?.id ? `/equipos/${club.id}` : "/equipos");
}

export function ClubCompetitionSwitcher({ clubId, currentEditionId }) {
  const { league } = useLeague();
  const reduceMotion = useReducedMotion();
  const competitions = useMemo(
    () => {
      const entriesByEdition = new Map(
        getClubCompetitionEntries(clubId, league.clubs).map((entry) => [entry.editionId, entry]),
      );
      return COMPETITION_EDITIONS.map((edition) => {
        const entry = entriesByEdition.get(edition.id);
        return {
          editionId: edition.id,
          label: edition.label,
          participated: Boolean(entry),
          profilePath: entry?.profilePath ?? `/equipos/${clubId}/${edition.id}`,
        };
      });
    },
    [clubId, league.clubs],
  );
  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 480, damping: 36, mass: 0.62 };

  return (
    <nav className="club-competition-switcher" aria-label="Seleccionar edición del equipo">
      <div className="club-competition-switcher-links">
        {competitions.map((competition) => {
          const isActive = competition.editionId === currentEditionId;
          return (
            <AppLink
              to={competition.profilePath}
              className={`${isActive ? "is-active" : ""}${competition.participated ? "" : " is-unavailable"}`.trim()}
              aria-current={isActive ? "page" : undefined}
              aria-label={competition.participated ? competition.label : `${competition.label} · sin participación`}
              key={competition.editionId}
            >
              {isActive && (
                <motion.span
                  className="club-competition-switcher-indicator"
                  layoutId={`club-competition-indicator-${clubId}`}
                  transition={indicatorTransition}
                  aria-hidden="true"
                />
              )}
              <span>{competition.label}</span>
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}

export function StandingsTable({ standings, limit, highlightClubId, compact = false }) {
  const rows = limit ? standings.slice(0, limit) : standings;
  return (
    <div className={`standings-wrap ${compact ? "is-compact" : ""}`}>
      <table className="standings-table">
        <thead>
          <tr>
            <th scope="col">Pos.</th>
            <th scope="col">Equipo</th>
            <th scope="col" title="Partidos jugados">PJ</th>
            <th scope="col" title="Victorias">PG</th>
            <th scope="col" title="Victorias por penaltis">PGP</th>
            <th scope="col" title="Derrotas por penaltis">PPP</th>
            <th scope="col" title="Derrotas">PP</th>
            <th scope="col">GF</th>
            <th scope="col">GC</th>
            <th scope="col">DG</th>
            <th scope="col">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={row.club.id === highlightClubId ? "is-highlighted" : ""} key={row.club.id}>
              <td className="standing-position">{String(row.position).padStart(2, "0")}</td>
              <th scope="row">
                <AppLink to={clubProfilePath(row.club)} className="standing-team">
                  <ClubCrest club={row.club} size="xs" decorative />
                  <span>{row.club.name}</span>
                </AppLink>
              </th>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.penaltyWins}</td>
              <td>{row.penaltyLosses}</td>
              <td>{row.losses}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td className={row.goalDifference > 0 ? "positive" : row.goalDifference < 0 ? "negative" : ""}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
              <td className="standing-points">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatOfficialStandingValue(row, key) {
  const value = row[key] ?? 0;
  return key === "goalDifference" && value > 0 ? `+${value}` : value;
}

export function OfficialStandingsBoard({ standings, highlightClubId, editionId = "split-3" }) {
  const config = OFFICIAL_STANDINGS_CONFIGS[editionId] ?? OFFICIAL_STANDINGS_CONFIGS["split-3"];
  if (standings.length !== config.rows) return <StandingsTable standings={standings} highlightClubId={highlightClubId} />;

  const boardStyle = {
    "--official-board-image": `url("${publicAsset(config.background)}")`,
    "--official-board-aspect-ratio": `${config.width} / ${config.height}`,
    "--official-board-heading-top": `${(config.headingTop / config.height) * 100}%`,
    "--official-board-row-height": `${(config.rowHeight / config.height) * 100}%`,
  };

  return (
    <section className="official-board-section official-standings-section" aria-label="Clasificación oficial">
      <div className="official-board-desktop">
        <div
          className={`official-standings-board official-standings-board--${editionId}`}
          role="table"
          aria-label={`Tabla de clasificación de ${editionId === "elite-cup" ? "la Elite Cup" : "la Elite League"}`}
          aria-rowcount={standings.length + 1}
          style={boardStyle}
        >
          <div role="rowgroup">
            <div className="official-standings-heading official-standings-heading-position" role="columnheader">POS.</div>
            <div className="official-standings-heading official-standings-heading-team" role="columnheader">EQUIPO</div>
            {OFFICIAL_STANDINGS_COLUMNS.map((column) => (
              <div className="official-standings-heading official-standings-heading-stat" role="columnheader" style={{ left: `${column.x}%` }} key={column.key} title={column.description}>{column.label}</div>
            ))}
          </div>
          <div role="rowgroup">
            {standings.map((row, index) => (
              <div
                className={`official-standings-row ${row.club.id === highlightClubId ? "is-highlighted" : ""}`}
                role="row"
                style={{ top: `${((config.rowTop + index * config.rowStep) / config.height) * 100}%` }}
                key={row.club.id}
              >
                <div className="official-standings-position" role="cell">{row.position}</div>
                <AppLink className="official-standings-crest-link" to={clubProfilePath(row.club)} aria-label={`Abrir ficha de ${row.club.name}`}>
                  <img src={row.club.crest} alt="" />
                </AppLink>
                <div className="official-standings-team" role="cell">
                  <AppLink to={clubProfilePath(row.club)} aria-label={`${row.club.name}, posición ${row.position}`}>{row.club.name}</AppLink>
                </div>
                {OFFICIAL_STANDINGS_COLUMNS.map((column) => (
                  <div className={`official-standings-stat official-standings-stat-${column.key}`} role="cell" style={{ left: `${column.x}%` }} aria-label={`${column.description}: ${formatOfficialStandingValue(row, column.key)}`} key={column.key}>
                    {formatOfficialStandingValue(row, column.key)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="official-board-mobile">
        <StandingsTable standings={standings} highlightClubId={highlightClubId} />
      </div>
    </section>
  );
}

function FixtureTeam({ team, side }) {
  const content = <><span className="fixture-team-name">{team.name}</span><ClubCrest club={team.club} size="md" decorative /></>;
  return team.href
    ? <AppLink className={`fixture-team fixture-team-${side}`} to={team.href}>{content}</AppLink>
    : <div className={`fixture-team fixture-team-${side}`}>{content}</div>;
}

export function FixtureCard({ match, emphasize = false, showMatchday = false, showDate = true, clubsById: suppliedClubsById }) {
  const currentClubsById = useClubsById();
  const clubsById = suppliedClubsById ?? currentClubsById;
  const card = getFixtureCardModel(match, clubsById, { showMatchday, showDate });
  return (
    <article className={`fixture-card ${emphasize ? "is-emphasized" : ""}`} aria-label={card.accessibleLabel}>
      <div className="fixture-card-canvas">
        <span className="fixture-order">{card.orderLabel}</span>
        {card.roundLabel && <span className="fixture-round">{card.roundLabel}</span>}
        <span className={`fixture-status fixture-status-${card.status.tone}`}>{card.status.label}</span>
        <FixtureTeam team={card.home} side="home" />
        <FixtureTeam team={card.away} side="away" />
        {card.hasResult && <span className="fixture-goals fixture-goals-home">{card.homeScore}</span>}
        <span className="fixture-versus" aria-hidden="true">VS</span>
        {card.hasResult && <span className="fixture-goals fixture-goals-away">{card.awayScore}</span>}
        {card.penalties && (
          <span className="fixture-penalties" aria-label={`Penaltis: ${card.penalties.home} a ${card.penalties.away}`}>
            <small>Penaltis</small>
            <span><b>{card.penalties.home}</b><i>VS</i><b>{card.penalties.away}</b></span>
          </span>
        )}
        {card.dateLabel && <span className="fixture-date">{card.dateLabel}</span>}
      </div>
    </article>
  );
}

export function OfficialMatchdayBoard({ matchday, clubsById: suppliedClubsById }) {
  const currentClubsById = useClubsById();
  const clubsById = suppliedClubsById ?? currentClubsById;
  const matches = matchday?.matches ?? [];

  if (!matchday || matches.length !== 6) {
    return <div className="fixture-grid official-matchday-fallback">{matches.map((match) => <FixtureCard match={match} clubsById={clubsById} key={match.id} showMatchday />)}</div>;
  }

  return (
    <section className="official-board-section official-matchday-section" aria-label={`Partidos de la jornada ${matchday.number}`}>
      <div className="official-board-desktop">
        <div
          className="official-matchday-board"
          role="table"
          aria-label={`Partidos de la jornada ${matchday.number}`}
          aria-rowcount={matches.length + 1}
          style={{ "--official-board-image": `url("${publicAsset("/psd/jornada-actual-bg.png")}")` }}
        >
          <div role="rowgroup">
            <div className="official-matchday-pill">Jornada {matchday.number}</div>
            <div className="official-matchday-heading official-matchday-heading-order" role="columnheader">ORDEN</div>
            <div className="official-matchday-heading official-matchday-heading-match" role="columnheader">PARTIDO</div>
          </div>
          <div role="rowgroup">
            {matches.map((match, index) => {
              const home = clubsById[match.homeClubId];
              const away = clubsById[match.awayClubId];
              const status = getMatchStatus(match);
              const hasResult = isOfficialResult(match);
              const hasPenalties = hasResult && Number.isFinite(match.penalties?.home) && Number.isFinite(match.penalties?.away);
              const order = match.order ?? index + 1;
              return (
                <div className={`official-matchday-row official-matchday-row-${status.tone}`} role="row" aria-label={`Partido ${order}: ${home?.name ?? "Local"} contra ${away?.name ?? "Visitante"}. ${status.label}.`} style={{ top: `${(MATCHDAY_ROW_POSITIONS[index] / 1325) * 100}%` }} key={match.id}>
                  <div className="official-matchday-order" role="cell">{order}º</div>
                  <div className="official-matchday-team official-matchday-home" role="cell">
                    <AppLink to={clubProfilePath(home)}>{home?.name}</AppLink>
                  </div>
                  <AppLink className="official-matchday-crest official-matchday-home-crest" to={clubProfilePath(home)} aria-label={`Abrir ficha de ${home?.name ?? "equipo local"}`}>
                    <img src={home?.crest} alt="" />
                  </AppLink>
                  {hasResult && <div className="official-matchday-score official-matchday-home-score" role="cell">{match.score.home}</div>}
                  <div className="official-matchday-versus" role="cell">VS</div>
                  {hasResult && <div className="official-matchday-score official-matchday-away-score" role="cell">{match.score.away}</div>}
                  {hasPenalties && (
                    <div className="official-matchday-penalty-block" role="cell" aria-label={`Penaltis: ${match.penalties.home} a ${match.penalties.away}`}>
                      <span>Penaltis</span>
                      <strong><i>{match.penalties.home}</i><em>VS</em><i>{match.penalties.away}</i></strong>
                    </div>
                  )}
                  <AppLink className="official-matchday-crest official-matchday-away-crest" to={clubProfilePath(away)} aria-label={`Abrir ficha de ${away?.name ?? "equipo visitante"}`}>
                    <img src={away?.crest} alt="" />
                  </AppLink>
                  <div className="official-matchday-team official-matchday-away" role="cell">
                    <AppLink to={clubProfilePath(away)}>{away?.name}</AppLink>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="official-board-mobile fixture-stack">
        {matches.map((match) => <FixtureCard match={match} clubsById={clubsById} key={match.id} showMatchday />)}
      </div>
    </section>
  );
}

export function Split3PlayoffBoard({ stages }) {
  const matches = stages.flatMap((stage) => stage.matches.map((match) => ({ ...match, stageLabel: stage.label })));
  const sourceLabel = (slot) => {
    if (slot.type !== "winner") return null;
    const source = matches.find((match) => match.order === slot.matchOrder);
    const shortLabel = (team) => team.type === "seed" ? `${team.position}.º` : team.label;
    return source ? `${shortLabel(source.home)} vs ${shortLabel(source.away)}` : null;
  };
  const teamLabel = (slot) => <span className="split3-playoff-team-label"><span>{slot.label}</span>{sourceLabel(slot) && <small>{sourceLabel(slot)}</small>}</span>;

  return (
    <section className="official-board-section split3-playoff-section reveal-item" aria-label="Play-offs del Split 3">
      <h2 className="visually-hidden">Play-offs Split 3</h2>
      <div className="official-board-desktop">
        <div
          className="official-split3-playoff-board"
          role="table"
          aria-label="Fase final del Split 3"
          aria-rowcount={matches.length + 1}
          style={{ "--official-board-image": `url("${publicAsset("/psd/fase-final-bg.png")}")` }}
        >
          <div className="official-split3-playoff-heading official-split3-playoff-heading-order" role="columnheader">ORDEN</div>
          <div className="official-split3-playoff-heading official-split3-playoff-heading-home" role="columnheader">LOCAL</div>
          <div className="official-split3-playoff-heading official-split3-playoff-heading-away" role="columnheader">VISITANTE</div>
          <div role="rowgroup">
            {matches.map((match, index) => (
              <div
                className="official-split3-playoff-row"
                role="row"
                aria-label={`${match.stageLabel}. Partido ${match.order}: local, ${match.home.label}; visitante, ${match.away.label}.`}
                style={{ top: `${(SPLIT3_PLAYOFF_ROW_POSITIONS[index] / 2576) * 100}%` }}
                key={match.id}
              >
                <div className="official-split3-playoff-order" role="cell">{match.order}º</div>
                <div className="official-split3-playoff-team official-split3-playoff-home" role="cell">{teamLabel(match.home)}</div>
                <img className="official-split3-playoff-crest official-split3-playoff-home-crest" src={publicAsset(match.home.crest)} alt="" />
                <div className="official-split3-playoff-versus" role="cell">VS</div>
                <img className="official-split3-playoff-crest official-split3-playoff-away-crest" src={publicAsset(match.away.crest)} alt="" />
                <div className="official-split3-playoff-team official-split3-playoff-away" role="cell">{teamLabel(match.away)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="official-board-mobile split3-playoff-mobile">
        {stages.map((stage, stageIndex) => (
          <section className="split3-playoff-mobile-stage" aria-labelledby={`split3-playoff-stage-${stage.id}`} key={stage.id}>
            <h3 className="split3-playoff-mobile-stage-title" id={`split3-playoff-stage-${stage.id}`}>{stage.label}</h3>
            {stageIndex === 0 && <span className="split3-playoff-mobile-headings">Orden · Local / Visitante</span>}
            <div className="split3-playoff-mobile-round">
              {stage.matches.map((match) => (
                <article className="split3-playoff-mobile-row" aria-label={`Partido ${match.order}: local, ${match.home.label}; visitante, ${match.away.label}`} key={match.id}>
                  <span className="split3-playoff-mobile-order">{match.order}º</span>
                  <div className="split3-playoff-mobile-team split3-playoff-mobile-home">
                    {teamLabel(match.home)}
                    <img src={publicAsset(match.home.crest)} alt="" />
                  </div>
                  <span className="split3-playoff-mobile-versus">VS</span>
                  <div className="split3-playoff-mobile-team split3-playoff-mobile-away">
                    <img src={publicAsset(match.away.crest)} alt="" />
                    {teamLabel(match.away)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function MatchdayTabs({ matchdays, selectedNumber, onSelect, ariaLabel = "Jornadas de la competición" }) {
  return (
    <div className="matchday-tabs-wrap">
      <p className="eyebrow">Seleccionar jornada</p>
      <div className="matchday-tabs" role="tablist" aria-label={ariaLabel}>
        {matchdays.map((matchday) => {
          const isAvailable = matchday.isAvailable !== false;
          const isSelected = isAvailable && matchday.number === selectedNumber;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`Jornada ${matchday.number}${isAvailable ? "" : " · Próximamente"}`}
              aria-disabled={!isAvailable}
              className={`${isSelected ? "is-selected" : ""} ${matchday.status === "current" ? "is-current" : ""} ${isAvailable ? "" : "is-unavailable"}`}
              disabled={!isAvailable}
              key={matchday.id}
              onClick={() => isAvailable && onSelect(matchday.number)}
            >
              <strong>J{matchday.number}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getClubDirectoryCaption(club) {
  const president = club.president ?? club.founder;
  return president ? `${getClubLeadershipTitle(club)} · ${president}` : "Elite League";
}

export function ClubDirectory({ clubs, selectedEdition = "split-3", ariaLabel = "Equipos de Elite League" }) {
  const reduceMotion = useReducedMotion();
  const listTransition = reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] };

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        className="club-directory-grid"
        key={`edition-${selectedEdition}`}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={listTransition}
        aria-label={ariaLabel}
      >
        {clubs.map((club, index) => {
          const cardArt = getDirectoryCardArt(club, selectedEdition);
          return (
            <motion.div
              className="club-directory-motion-card"
              key={club.historyKey ?? club.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.32, delay: Math.min(index * 0.035, 0.24), ease: [0.2, 0.8, 0.2, 1] }}
            >
              <AppLink to={club.profilePath ?? `/equipos/${club.id}`} className={`club-directory-card has-card-art ${club.status === "inactive" ? "is-inactive" : ""}`} style={{ "--club-accent": club.color }}>
                <span className="club-directory-crest-stage"><img className="club-directory-card-art" src={cardArt} alt="" /></span>
                <span className="club-directory-copy">
                  <strong>{club.name}</strong>
                  {club.status === "inactive" && <small className="club-directory-status">Inactivo</small>}
                  <span className="club-directory-meta">
                    <em>{getClubDirectoryCaption(club)}</em>
                  </span>
                </span>
              </AppLink>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

export function StatisticLeaderboard({ title, description, entries = [], metric, metricLabel }) {
  const hasEntries = entries.length > 0;
  return (
    <div className="leaderboard-card">
      <div className="leaderboard-card-top"><span>{hasEntries ? "01" : "—"}</span><small>{hasEntries ? "Actualizado" : "Sin datos"}</small></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {hasEntries ? <ol className="leaderboard-list">{entries.map((entry, index) => <li key={entry.player.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{entry.player.name}</strong><small>{entry.club?.shortName ?? "Elite League"}</small></div><b>{entry[metric]}<small>{metricLabel}</small></b></li>)}</ol> : <EmptyState title="Aún no hay datos publicados" description="Las estadísticas aparecerán automáticamente al registrar los eventos de los partidos." />}
    </div>
  );
}
