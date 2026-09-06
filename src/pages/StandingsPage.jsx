import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MatchdayTabs, OfficialStandingsBoard } from "../components/competition";
import { EmptyState } from "../components/ui";
import { COMPETITION_RULES } from "../data/league";
import { COMPETITION_EDITIONS, getCompetitionEdition } from "../data/history";
import { getHistoricCompetitionData } from "../data/historyResults";
import { calculateStandingsThroughMatchday, isOfficialResult } from "../lib/leagueEngine";
import { navigate } from "../routes";
import { useLeague } from "../context/LeagueContext";

const STANDINGS_EDITIONS = COMPETITION_EDITIONS.filter((edition) => edition.type === "split" || edition.type === "cup");

function isStandingsEdition(edition) {
  return edition?.type === "split" || edition?.type === "cup";
}

function standingsPathForEdition(editionId) {
  return editionId === "split-3" ? "/clasificacion" : `/clasificacion/${editionId}`;
}

function getStandingsContext(editionId, selectedGroupId, league) {
  const edition = getCompetitionEdition(editionId);
  if (!isStandingsEdition(edition)) return null;

  if (edition.isCurrent) {
    return { edition, clubs: league.clubs, matchdays: league.matchdays, groups: [], groupId: null, groupLabel: null };
  }

  const historicalCompetition = getHistoricCompetitionData(edition.id, league.clubs);
  const groups = historicalCompetition?.groups ?? [];
  const group = groups.find((candidate) => candidate.id === selectedGroupId) ?? groups[0];
  if (!group) return null;

  return {
    edition,
    clubs: group.clubs,
    groups,
    groupId: group.id,
    groupLabel: group.label,
    matchdays: historicalCompetition.regularMatchdays.map((matchday) => ({
      ...matchday,
      matches: matchday.matches.filter((match) => match.groupId === group.id),
    })),
  };
}

function getMatchdaysWithAvailability(context) {
  const matchdays = context?.matchdays ?? [];
  if (!context?.edition.isCurrent) return matchdays.map((matchday) => ({ ...matchday, isAvailable: true }));

  const lastPublishedMatchday = matchdays.reduce(
    (latest, matchday) => (matchday.matches.some(isOfficialResult) ? Math.max(latest, matchday.number) : latest),
    0,
  );
  const availableThrough = Math.max(1, lastPublishedMatchday);
  return matchdays.map((matchday) => ({ ...matchday, isAvailable: matchday.number <= availableThrough }));
}

export function StandingsPage({ editionId }) {
  const { league } = useLeague();
  const reduceMotion = useReducedMotion();
  const requestedEdition = getCompetitionEdition(editionId);
  const selectedEditionId = isStandingsEdition(requestedEdition) ? requestedEdition.id : "split-3";
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const context = useMemo(() => getStandingsContext(selectedEditionId, selectedGroupId, league), [league, selectedEditionId, selectedGroupId]);
  const matchdays = useMemo(() => getMatchdaysWithAvailability(context), [context]);
  const availableMatchdays = matchdays.filter((matchday) => matchday.isAvailable !== false);
  const defaultMatchdayNumber = availableMatchdays.at(-1)?.number ?? matchdays.at(0)?.number ?? 1;
  const [selectedMatchdayNumber, setSelectedMatchdayNumber] = useState(defaultMatchdayNumber);

  useEffect(() => {
    setSelectedGroupId((previousGroupId) => (previousGroupId === context?.groupId ? previousGroupId : context?.groupId ?? null));
  }, [context?.groupId]);

  useEffect(() => {
    setSelectedMatchdayNumber(defaultMatchdayNumber);
  }, [defaultMatchdayNumber, selectedEditionId, context?.groupId]);

  const selectedMatchday = matchdays.find((matchday) => matchday.number === selectedMatchdayNumber && matchday.isAvailable !== false)
    ?? availableMatchdays.at(-1)
    ?? matchdays.at(0);
  const standings = useMemo(
    () => (context && selectedMatchday ? calculateStandingsThroughMatchday(context.clubs, context.matchdays, selectedMatchday.number) : []),
    [context, selectedMatchday],
  );
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] };

  if (!context || !selectedMatchday) {
    return <EmptyState title="Clasificación no disponible" description="La clasificación de este Split se publicará cuando estén disponibles sus jornadas." />;
  }

  return (
    <section className="standings-page">
      <header className="standings-edition-header reveal-item">
        <div className="matches-edition-selector" role="group" aria-label="Seleccionar Split de clasificación">
          {STANDINGS_EDITIONS.map((edition) => {
            const isActive = edition.id === selectedEditionId;
            return (
              <button
                type="button"
                aria-pressed={isActive}
                className={isActive ? "is-active" : ""}
                key={edition.id}
                onClick={() => navigate(standingsPathForEdition(edition.id))}
              >
                {isActive && <motion.span className="matches-edition-selector-indicator" layoutId="standings-edition-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34, mass: 0.65 }} />}
                <span>{edition.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="standings-workspace" aria-label={`Clasificación de ${context.edition.label}`}>
        {context.groups.length > 1 && (
          <div className="standings-group-selector" role="group" aria-label="Seleccionar grupo de la Elite Cup">
            {context.groups.map((group) => {
              const isActive = group.id === context.groupId;
              return (
                <button type="button" aria-pressed={isActive} className={isActive ? "is-active" : ""} key={group.id} onClick={() => setSelectedGroupId(group.id)}>
                  {isActive && <motion.span className="standings-group-selector-indicator" layoutId="standings-group-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34, mass: 0.65 }} />}
                  <span>{group.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <MatchdayTabs matchdays={matchdays} selectedNumber={selectedMatchday.number} onSelect={setSelectedMatchdayNumber} ariaLabel={`Jornadas de clasificación de ${context.edition.label}`} />

        <AnimatePresence initial={false} mode="wait">
          <motion.section
            className="standings-board-stage"
            key={`${selectedEditionId}-${context.groupId ?? "all"}-${selectedMatchday.number}`}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -7 }}
            transition={transition}
            aria-live="polite"
          >
            <p className="eyebrow standings-board-eyebrow">{[context.edition.label, context.groupLabel, `Jornada ${selectedMatchday.number}`].filter(Boolean).join(" · ")}</p>
            <OfficialStandingsBoard standings={standings} editionId={selectedEditionId} />
          </motion.section>
        </AnimatePresence>
      </section>

      <section className="classification-guides reveal-item" aria-label="Criterios de clasificación">
        <article className="classification-guide-card">
          <p className="eyebrow">Puntuación</p>
          <ul className="rules-list">
            <li><strong>3</strong><span>Victoria</span></li>
            <li><strong>2</strong><span>Victoria en penaltis</span></li>
            <li><strong>1</strong><span>Derrota en penaltis</span></li>
            <li><strong>0</strong><span>Derrota</span></li>
          </ul>
        </article>
        <article className="classification-guide-card">
          <p className="eyebrow">Desempates</p>
          <ol className="tiebreak-list">{COMPETITION_RULES.tiebreakers.map((rule) => <li key={rule}>{rule}</li>)}</ol>
        </article>
      </section>
    </section>
  );
}
