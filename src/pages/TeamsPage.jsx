import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClubDirectory } from "../components/competition";
import { useLeague } from "../context/LeagueContext";
import { navigate } from "../routes";
import { COMPETITION_EDITIONS, getCompetitionEdition, getEditionGroups } from "../data/history";

export function TeamsPage({ editionId }) {
  const { league } = useLeague();
  const reduceMotion = useReducedMotion();
  const selectedEditionId = getCompetitionEdition(editionId)?.id ?? "split-3";
  const selectedEdition = getCompetitionEdition(selectedEditionId) ?? COMPETITION_EDITIONS.at(-1);
  const editionTransition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] };
  const editionGroups = useMemo(
    () => getEditionGroups(selectedEditionId, league.clubs),
    [league.clubs, selectedEditionId],
  );

  return (
    <section className="clubs-directory-page">
      <header className="clubs-directory-header reveal-item">
        <div className="teams-split-selector" role="group" aria-label="Seleccionar edición">
          {COMPETITION_EDITIONS.map((edition) => {
            const isActive = edition.id === selectedEditionId;
            return (
              <button
                type="button"
                aria-pressed={isActive}
                className={isActive ? "is-active" : ""}
                key={edition.id}
                onClick={() => navigate(`/equipos/${edition.id}`)}
              >
                {isActive && <motion.span className="teams-split-selector-indicator" layoutId="teams-split-indicator" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34, mass: 0.65 }} />}
                <span>{edition.label}</span>
              </button>
            );
          })}
        </div>
      </header>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          className="clubs-edition-groups"
          key={selectedEditionId}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={editionTransition}
        >
          {editionGroups.map((group) => (
            <section className="clubs-edition-group" key={`${selectedEditionId}-${group.id}`}>
              {group.label && <h2 className="clubs-edition-group-title">{group.label}</h2>}
              <ClubDirectory
                clubs={group.clubs}
                selectedEdition={`${selectedEditionId}-${group.id}`}
                ariaLabel={`${group.label ? `${group.label} · ` : ""}${selectedEdition.label}`}
              />
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
