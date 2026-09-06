import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClubCompetitionSwitcher, FixtureCard, OfficialStandingsBoard, StandingsTable } from "../components/competition";
import { ClubKits } from "../components/ClubKits";
import { AppLink, ClubCrest, EmptyState, SectionHeading, StatusBadge, siteAsset } from "../components/ui";
import { calculateStandings, getClubFixtures } from "../lib/leagueEngine";
import { useLeague } from "../context/LeagueContext";
import { getClubLeadershipTitle } from "../data/league";
import { getClubCrestVersions, getCompetitionEdition } from "../data/history";
import { getHistoricCompetitionData } from "../data/historyResults";

function getTrophyDetails(honour) {
  const normalizedHonour = honour.toLocaleLowerCase("es");
  const split = honour.match(/(\d+)(?:º|ª)\s+split/i);
  const edition = honour.match(/(\d+)(?:º|ª)\s+edición/i);
  const achievement = split ? `Split ${split[1]}` : edition ? `${edition[1]}ª edición` : honour;

  if (normalizedHonour.includes("elite cup")) {
    return { id: "elite-cup", competition: "Elite Cup", icon: siteAsset("/trophies/elite-cup.png"), achievement };
  }

  if (normalizedHonour.includes("play-off") || normalizedHonour.includes("playoff")) {
    return { id: "elite-playoffs", competition: "Elite Play-Offs", icon: siteAsset("/trophies/elite-playoffs.png"), achievement };
  }

  return { id: "elite-league", competition: "Elite League", icon: siteAsset("/trophies/elite-league.png"), achievement };
}

function groupTrophies(honours) {
  return honours.map(getTrophyDetails).reduce((groups, trophy) => {
    const currentGroup = groups.find((group) => group.id === trophy.id);
    if (currentGroup) {
      currentGroup.achievements.push(trophy.achievement);
    } else {
      groups.push({ ...trophy, achievements: [trophy.achievement] });
    }
    return groups;
  }, []);
}

function currentEditionContext(club, league, standings) {
  return {
    edition: getCompetitionEdition("split-3"),
    participated: league.clubs.some((candidate) => candidate.id === club.id),
    groupLabel: null,
    fixtures: getClubFixtures(league.matchdays, club.id),
    playoffStages: [],
    standings,
    clubsById: Object.fromEntries(league.clubs.map((candidate) => [candidate.id, candidate])),
  };
}

function historicEditionContext(club, editionId, league) {
  const edition = getCompetitionEdition(editionId);
  const competitionData = getHistoricCompetitionData(editionId, league.clubs);
  const group = competitionData?.groups.find((candidate) => candidate.clubs.some((candidateClub) => candidateClub.id === club.id)) ?? null;
  const groupMatches = group?.regularMatches ?? [];
  const playoffStages = competitionData?.playoffStages
    .map((stage) => ({ ...stage, matches: stage.matches.filter((match) => match.homeClubId === club.id || match.awayClubId === club.id) }))
    .filter((stage) => stage.matches.length > 0) ?? [];

  return {
    edition,
    participated: Boolean(group),
    groupLabel: group?.label ?? null,
    fixtures: groupMatches.filter((match) => match.homeClubId === club.id || match.awayClubId === club.id),
    playoffStages,
    standings: group ? calculateStandings(group.clubs, groupMatches) : [],
    clubsById: Object.fromEntries((competitionData?.clubs ?? []).map((candidate) => [candidate.id, candidate])),
  };
}

function ClubEditionContent({ context, clubId }) {
  const editionContext = context.groupLabel ? `${context.edition.label} · ${context.groupLabel}` : context.edition.label;

  if (!context.participated) {
    return <section className="club-edition-section panel"><EmptyState title={`Sin participación en ${context.edition.label}`} description="Este club no disputó esta edición de la Elite League." /></section>;
  }

  return (
    <>
      <section className="club-edition-section">
        <SectionHeading eyebrow={editionContext} title="Partidos" />
        {context.fixtures.length ? <div className="fixture-grid compact-fixture-grid">{context.fixtures.map((fixture) => <FixtureCard match={fixture} clubsById={context.clubsById} key={fixture.id} showMatchday />)}</div> : <EmptyState title="Sin partidos registrados" description="Los resultados de esta edición se añadirán aquí cuando estén disponibles." />}
      </section>

      {context.playoffStages.length > 0 && (
        <section className="club-edition-section">
          <SectionHeading title="Eliminatorias" />
          <div className="club-edition-playoffs">
            {context.playoffStages.map((stage) => (
              <section className="club-edition-playoff-stage" aria-label={stage.label} key={stage.id}>
                <h3>{stage.label}</h3>
                <div className="fixture-grid compact-fixture-grid">{stage.matches.map((fixture) => <FixtureCard match={fixture} clubsById={context.clubsById} key={fixture.id} />)}</div>
              </section>
            ))}
          </div>
        </section>
      )}

      <section className="club-edition-section">
        <SectionHeading eyebrow={context.groupLabel ?? context.edition.label} title="Clasificación" />
        {context.standings.length === 12 || context.edition.id === "elite-cup"
          ? <div className="club-edition-standings-board"><OfficialStandingsBoard standings={context.standings} highlightClubId={clubId} editionId={context.edition.id} /></div>
          : <div className="panel"><StandingsTable standings={context.standings} highlightClubId={clubId} compact /></div>}
      </section>
    </>
  );
}

function getCrestPeriodLabel(version) {
  if (version.from === version.until) return `Utilizado durante ${version.from}`;
  if (version.until === "Actualidad") return `En uso desde ${version.from}`;
  return `Utilizado desde ${version.from} hasta ${version.until}`;
}

function ClubCrestHistoryDialog({ club, crestVersions }) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const selectedCrest = crestVersions[selectedIndex] ?? crestVersions[0];
  const hasHistoricCrests = crestVersions.length > 1;
  const dialogTitleId = `crest-history-${club.id}`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const changeCrest = (direction) => {
      setSelectedIndex((index) => (index + direction + crestVersions.length) % crestVersions.length);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowLeft") changeCrest(-1);
      if (event.key === "ArrowRight") changeCrest(1);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(focusFrame);
      triggerRef.current?.focus();
    };
  }, [crestVersions.length, isOpen]);

  if (!hasHistoricCrests) return null;

  const changeCrest = (direction) => {
    setSelectedIndex((index) => (index + direction + crestVersions.length) % crestVersions.length);
  };
  const openDialog = () => {
    setSelectedIndex(0);
    setIsOpen(true);
  };

  return (
    <>
      <button className="club-crest-history-trigger" type="button" aria-haspopup="dialog" ref={triggerRef} onClick={openDialog}>
        <span>Ver escudos anteriores</span>
        <span aria-hidden="true">→</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="club-crest-dialog-backdrop"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <motion.section
              className="club-crest-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <header className="club-crest-dialog-header">
                <div><p>Escudos del club</p><h2 id={dialogTitleId}>{club.name}</h2></div>
                <button type="button" aria-label="Cerrar visor de escudos" ref={closeButtonRef} onClick={() => setIsOpen(false)}><span>Cerrar</span><b aria-hidden="true">×</b></button>
              </header>

              <div className="club-crest-dialog-stage">
                <button className="club-crest-dialog-arrow is-previous" type="button" aria-label="Ver escudo anterior" onClick={() => changeCrest(-1)}>←</button>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    className="club-crest-dialog-art"
                    key={selectedCrest.id}
                    initial={reduceMotion ? false : { opacity: 0, x: 26, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -26, scale: 1.035 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <img src={selectedCrest.crest} alt={`${selectedCrest.label} de ${club.name}`} />
                  </motion.div>
                </AnimatePresence>
                <button className="club-crest-dialog-arrow is-next" type="button" aria-label="Ver siguiente escudo" onClick={() => changeCrest(1)}>→</button>
              </div>

              <footer className="club-crest-dialog-details" aria-live="polite">
                <span className="club-crest-dialog-count">{selectedIndex + 1} / {crestVersions.length}</span>
                <div><p>{selectedCrest.label}</p><strong>{getCrestPeriodLabel(selectedCrest)}</strong></div>
                <div className="club-crest-dialog-pagination" aria-label="Seleccionar versión del escudo">
                  {crestVersions.map((version, index) => <button type="button" className={index === selectedIndex ? "is-active" : ""} key={version.id} aria-label={version.label} aria-pressed={index === selectedIndex} onClick={() => setSelectedIndex(index)} />)}
                </div>
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ClubProfileIdentity({ club, backTo, backLabel = "Todos los clubes" }) {
  const crestVersions = getClubCrestVersions(club);
  return <header className="club-profile-identity">
    {backTo && <AppLink to={backTo} className="back-link">← {backLabel}</AppLink>}
    <div className="club-profile-crest-stage"><ClubCrest club={club} size="xl" decorative /></div>
    <div className="club-profile-title"><h1>{club.name}</h1>{club.status === "inactive" && <StatusBadge tone="finished">Inactivo</StatusBadge>}</div>
    <ClubCrestHistoryDialog club={club} crestVersions={crestVersions} />
  </header>;
}

export function ClubProfileOverview({ club }) {
  const representativeColors = club.representativeColors?.length ? club.representativeColors : [club.color].filter(Boolean);
  const honours = club.honours ?? [];
  const trophyGroups = groupTrophies(honours);
  const leadershipTitle = club.leadershipTitle ?? getClubLeadershipTitle(club);
  const president = club.president ?? club.founder ?? "N/D";
  return <section className="club-profile-overview">
    <article className="panel">
      <SectionHeading title="Información del equipo" />
      <dl className="club-profile-facts">
        <div><dt>Año de fundación</dt><dd>{club.founded || "N/D"}</dd></div>
        <div><dt>{leadershipTitle}</dt><dd>{president}</dd></div>
        <div><dt>Colores representativos</dt><dd><ul className="club-color-list">{representativeColors.map((color) => <li key={color}><i style={{ "--swatch-color": color }} aria-hidden="true" /><code>{color}</code></li>)}</ul></dd></div>
      </dl>
    </article>
    <article className="panel palmares-panel">
      <SectionHeading title="Palmarés" />
      {honours.length ? <ul className="club-honours-list">{trophyGroups.map((trophy) => <li className="club-honour-card" key={trophy.id}><h3><span>{trophy.achievements.length}×</span> campeón de {trophy.competition}</h3><div className="club-honour-body"><span className="club-honour-icon" aria-hidden="true"><img src={trophy.icon} alt="" /></span><p className="club-honour-achievements">{trophy.achievements.map((achievement) => <span key={achievement}>{achievement}</span>)}</p></div></li>)}</ul> : <p className="club-history-empty">Este club todavía no ha levantado un título.</p>}
    </article>
  </section>;
}

export function TeamPage({ club, editionId = "split-3" }) {
  const { league, standings } = useLeague();
  const reduceMotion = useReducedMotion();
  const selectedEdition = getCompetitionEdition(editionId) ?? getCompetitionEdition("split-3");
  const players = league.players.filter((player) => player.clubId === club.id && player.status === "active");
  const directoryPath = selectedEdition.isCurrent ? "/equipos" : `/equipos/${selectedEdition.id}`;
  const context = useMemo(
    () => (selectedEdition.isCurrent ? currentEditionContext(club, league, standings) : historicEditionContext(club, selectedEdition.id, league)),
    [club, league, selectedEdition.id, selectedEdition.isCurrent, standings],
  );
  const editionTransition = reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 0.8, 0.2, 1] };

  return (
    <article className="club-profile-page" style={{ "--club-accent": club.color ?? "#3f7c35" }}>
      <ClubProfileIdentity club={club} backTo={directoryPath} />
      <ClubProfileOverview club={club} />
      <ClubKits club={club} />

      <section className="club-roster-section panel">
        <SectionHeading title="Plantilla" />
        {players.length ? <div className="roster-list">{players.map((player) => <div key={player.id}><span>{player.shirtNumber ?? "—"}</span><strong>{player.name}</strong><small>{player.positionGroup === "GK" ? "Portero" : "Jugador de campo"}</small></div>)}</div> : <EmptyState title="Plantilla pendiente" description="Los jugadores se añadirán cuando estén registrados." />}
      </section>

      <ClubCompetitionSwitcher clubId={club.id} currentEditionId={selectedEdition.id} />

      <div className="club-edition-area" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div className="club-edition-motion" key={selectedEdition.id} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -7 }} transition={editionTransition} layout>
            <ClubEditionContent context={context} clubId={club.id} />
          </motion.div>
        </AnimatePresence>
      </div>
    </article>
  );
}
