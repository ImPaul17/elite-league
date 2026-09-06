import { useMemo } from "react";
import { ClubCompetitionSwitcher, FixtureCard, StandingsTable } from "../components/competition";
import { AppLink, ClubCrest, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";
import { getHistoricCompetitionData } from "../data/historyResults";
import { calculateStandings } from "../lib/leagueEngine";

function clubStatusLabel(status) {
  return status === "inactive" ? "Inactivo" : "Activo";
}

export function HistoricalClubPage({ club }) {
  const { league } = useLeague();
  const colors = club.representativeColors?.length ? club.representativeColors : [club.color].filter(Boolean);
  const leadershipTitle = club.leadershipTitle ?? "Presidente";
  const president = club.president ?? club.founder;
  const status = clubStatusLabel(club.status);
  const historyContext = [club.editionLabel, club.groupLabel].filter(Boolean).join(" · ");
  const competitionData = useMemo(
    () => getHistoricCompetitionData(club.editionId, league.clubs),
    [club.editionId, league.clubs],
  );
  const group = competitionData?.groups.find((competitionGroup) => competitionGroup.id === club.groupId) ?? competitionData?.groups[0] ?? null;
  const groupMatches = group?.regularMatches ?? competitionData?.regularMatches ?? [];
  const standings = useMemo(
    () => competitionData && group ? calculateStandings(group.clubs, groupMatches) : [],
    [competitionData, group, groupMatches],
  );
  const clubsById = useMemo(
    () => Object.fromEntries((competitionData?.clubs ?? []).map((competitionClub) => [competitionClub.id, competitionClub])),
    [competitionData],
  );
  const standing = standings.find((entry) => entry.club.id === club.id);
  const regularFixtures = groupMatches.filter(
    (match) => match.homeClubId === club.id || match.awayClubId === club.id,
  );
  const playoffStages = competitionData?.playoffStages
    .map((stage) => ({
      ...stage,
      matches: stage.matches.filter((match) => match.homeClubId === club.id || match.awayClubId === club.id),
    }))
    .filter((stage) => stage.matches.length > 0) ?? [];
  const description = [
    `Participante de ${club.editionLabel}`,
    club.status === "inactive" ? "club inactivo" : "club actualmente activo",
    president ? `${leadershipTitle}: ${president}` : null,
  ].filter(Boolean).join(" · ");
  const phaseLabel = competitionData?.groups.length > 1 ? "Fase de grupos" : "Fase regular";
  const standingsTitle = group?.label ? `Clasificación ${group.label}` : "Clasificación final";

  return (
    <>
      <AppLink to={`/equipos/${club.editionId}`} className="back-link">← Todos los equipos</AppLink>
      <PageHero eyebrow={historyContext} title={club.name} description={description} meta={<span>Estado <strong>{status}</strong></span>} className="historical-club-hero">
        <div className="club-hero-crest" style={{ "--club-accent": club.color }}><ClubCrest club={club} size="xl" decorative /></div>
      </PageHero>
      <ClubCompetitionSwitcher clubId={club.id} currentEditionId={club.editionId} />

      {competitionData && (
        <section className="club-summary-grid reveal-item" aria-label={`Resumen de ${club.name} en ${club.editionLabel}`}>
          {[["PJ", standing?.played], ["PG", standing?.wins], ["GF", standing?.goalsFor], ["DG", standing?.goalDifference], ["PTS", standing?.points]].map(([label, value]) => (
            <div className="club-stat" key={label}><span>{label}</span><strong>{value ?? 0}</strong></div>
          ))}
        </section>
      )}

      <section className="club-profile-details-grid reveal-item">
        <article className="panel">
          <SectionHeading eyebrow="Archivo de competición" title="Datos de la edición" />
          <dl className="club-profile-facts">
            <div><dt>Competición</dt><dd>{club.editionLabel}</dd></div>
            {club.groupLabel && <div><dt>Grupo</dt><dd>{club.groupLabel}</dd></div>}
            <div><dt>Estado</dt><dd>{status}</dd></div>
            {president && <div><dt>{leadershipTitle}</dt><dd>{president}</dd></div>}
            {colors.length > 0 && (
              <div>
                <dt>Color representativo</dt>
                <dd>
                  <ul className="club-color-list">
                    {colors.map((color) => <li key={color}><i style={{ "--swatch-color": color }} aria-hidden="true" /><code>{color}</code></li>)}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </article>
        <article className="panel historical-club-note">
          <SectionHeading eyebrow="Historial" title={competitionData ? "Archivo de resultados" : "Ficha en construcción"} />
          <p>
            {competitionData
              ? `La ${phaseLabel.toLocaleLowerCase("es")} y las eliminatorias registradas de esta edición ya forman parte del archivo del club.`
              : "Esta ficha conserva la identidad del club en esta edición. Iremos añadiendo sus plantillas, resultados y estadísticas históricas."}
          </p>
          {club.status !== "inactive" && <AppLink to={`/equipos/${club.id}`} className="button button-outline">Ver ficha actual</AppLink>}
        </article>
      </section>

      {competitionData && (
        <>
          <section className="content-section reveal-item">
            <SectionHeading eyebrow={phaseLabel} title="Partidos disputados" />
            <div className="fixture-grid compact-fixture-grid">
              {regularFixtures.map((match) => <FixtureCard match={match} clubsById={clubsById} key={match.id} showMatchday />)}
            </div>
          </section>

          {playoffStages.length > 0 && (
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
          )}

          <section className="content-section reveal-item">
            <SectionHeading eyebrow={phaseLabel} title={standingsTitle} />
            <div className="panel"><StandingsTable standings={standings} highlightClubId={club.id} compact /></div>
          </section>
        </>
      )}
    </>
  );
}
