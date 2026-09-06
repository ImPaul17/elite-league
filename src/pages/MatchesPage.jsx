import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FixtureCard, MatchdayTabs, OfficialMatchdayBoard, Split3PlayoffBoard } from "../components/competition";
import { SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";
import { COMPETITION_EDITIONS, getCompetitionEdition } from "../data/history";
import { getHistoricCompetitionData } from "../data/historyResults";
import { SPLIT_3_PLAYOFF_STAGES } from "../data/split3Playoffs";
import { navigate } from "../routes";

function matchesPathForEdition(editionId) {
  return editionId === "split-3" ? "/partidos" : `/partidos/${editionId}`;
}

function HistoricalMatchdayGroups({ groups, selectedMatchday, clubsById, selectedGroupId }) {
  const visibleGroups = groups.filter((group) => selectedGroupId === "all" || group.id === selectedGroupId);

  return (
    <div className="historical-matchday-groups">
      {visibleGroups.map((group) => {
        const matches = selectedMatchday.matches.filter((match) => match.groupId === group.id);
        if (!matches.length) return null;
        return (
          <section className="historical-matchday-group" key={group.id} aria-label={group.label ?? "Partidos de la jornada"}>
            {groups.length > 1 && <h3>{group.label}</h3>}
            <div className="fixture-grid compact-fixture-grid">
              {matches.map((match) => <FixtureCard match={match} clubsById={clubsById} key={match.id} showDate={false} showMatchday />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function HistoricalPlayoffs({ playoffStages, clubsById }) {
  if (!playoffStages.length) return null;
  return (
    <section className="content-section reveal-item">
      <SectionHeading eyebrow="Eliminatorias" title="Play-offs" />
      <div className="historical-playoff-stages">
        {playoffStages.map((stage) => (
          <section className="historical-playoff-stage" key={stage.id} aria-label={stage.label}>
            <h3>{stage.label}</h3>
            <div className="fixture-grid compact-fixture-grid">
              {stage.matches.map((match) => <FixtureCard match={match} clubsById={clubsById} key={match.id} />)}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function MatchesPage({ editionId }) {
  const { league, currentMatchday } = useLeague();
  const reduceMotion = useReducedMotion();
  const selectedEditionId = getCompetitionEdition(editionId)?.id ?? "split-3";
  const selectedEdition = getCompetitionEdition(selectedEditionId) ?? COMPETITION_EDITIONS.at(-1);
  const isCurrentEdition = selectedEditionId === "split-3";
  const historicalCompetition = useMemo(
    () => isCurrentEdition ? null : getHistoricCompetitionData(selectedEditionId, league.clubs),
    [isCurrentEdition, league.clubs, selectedEditionId],
  );
  const matchdays = historicalCompetition?.regularMatchdays ?? league.matchdays;
  const defaultMatchdayNumber = isCurrentEdition ? currentMatchday?.number ?? 1 : 1;
  const [selectedNumber, setSelectedNumber] = useState(defaultMatchdayNumber);
  const [selectedView, setSelectedView] = useState("matchdays");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const selectedMatchday = matchdays.find((matchday) => matchday.number === selectedNumber) ?? matchdays[0];
  const historicalGroups = historicalCompetition?.groups ?? [];
  const playoffStages = isCurrentEdition ? SPLIT_3_PLAYOFF_STAGES : historicalCompetition?.playoffStages ?? [];
  const historicalClubsById = useMemo(
    () => Object.fromEntries((historicalCompetition?.clubs ?? []).map((club) => [club.id, club])),
    [historicalCompetition],
  );
  const isGroupCompetition = historicalGroups.length > 1;
  const hasPlayoffs = playoffStages.length > 0;
  const editionTransition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] };

  useEffect(() => {
    setSelectedNumber(defaultMatchdayNumber);
    setSelectedView("matchdays");
    setSelectedGroupId("all");
  }, [defaultMatchdayNumber, selectedEditionId]);

  return (
    <section className="matches-page">
      <header className="matches-edition-header reveal-item">
        <div className="matches-edition-selector" role="group" aria-label="Seleccionar edición de partidos">
          {COMPETITION_EDITIONS.map((edition) => {
            const isActive = edition.id === selectedEditionId;
            return (
              <button
                type="button"
                aria-pressed={isActive}
                className={isActive ? "is-active" : ""}
                key={edition.id}
                onClick={() => navigate(matchesPathForEdition(edition.id))}
              >
                {isActive && <motion.span className="matches-edition-selector-indicator" layoutId="matches-edition-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34, mass: 0.65 }} />}
                <span>{edition.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={selectedEditionId}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={editionTransition}
        >
          {hasPlayoffs && (
            <div className="matches-archive-controls reveal-item">
              <div className="matches-view-toggle" role="tablist" aria-label="Fase de la competición">
                <button type="button" role="tab" aria-selected={selectedView === "matchdays"} className={selectedView === "matchdays" ? "is-active" : ""} onClick={() => setSelectedView("matchdays")}>Jornadas</button>
                <button type="button" role="tab" aria-selected={selectedView === "playoffs"} className={selectedView === "playoffs" ? "is-active" : ""} onClick={() => setSelectedView("playoffs")}>Eliminatorias</button>
              </div>
              {isGroupCompetition && selectedView === "matchdays" && (
                <div className="matches-group-filter" role="group" aria-label="Filtrar partidos de Elite Cup por grupo">
                  <button type="button" className={selectedGroupId === "all" ? "is-active" : ""} aria-pressed={selectedGroupId === "all"} onClick={() => setSelectedGroupId("all")}>Todos</button>
                  {historicalGroups.map((group) => <button type="button" className={selectedGroupId === group.id ? "is-active" : ""} aria-pressed={selectedGroupId === group.id} onClick={() => setSelectedGroupId(group.id)} key={group.id}>{group.label}</button>)}
                </div>
              )}
            </div>
          )}

          {selectedView === "matchdays" ? (
            <section className="content-section matches-calendar-section reveal-item">
              <MatchdayTabs matchdays={matchdays} selectedNumber={selectedNumber} onSelect={setSelectedNumber} ariaLabel={`Jornadas de ${selectedEdition.label}`} />
              {isCurrentEdition ? (
                <OfficialMatchdayBoard matchday={selectedMatchday} />
              ) : isGroupCompetition ? (
                <HistoricalMatchdayGroups groups={historicalGroups} selectedMatchday={selectedMatchday} clubsById={historicalClubsById} selectedGroupId={selectedGroupId} />
              ) : (
                <OfficialMatchdayBoard matchday={selectedMatchday} clubsById={historicalClubsById} />
              )}
            </section>
          ) : isCurrentEdition ? (
            <Split3PlayoffBoard stages={playoffStages} />
          ) : (
            <HistoricalPlayoffs playoffStages={playoffStages} clubsById={historicalClubsById} />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
