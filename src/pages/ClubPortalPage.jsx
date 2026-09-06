import { useEffect, useMemo, useState } from "react";
import { FormationBuilder } from "../components/operations";
import { FixtureCard, OfficialStandingsBoard, StandingsTable } from "../components/competition";
import { AppLink, EmptyState, Notice, PageHero, SectionHeading } from "../components/ui";
import { ClubAreaNavigation } from "../components/ClubAreaNavigation";
import { getClubFixtures, getNextClubFixture } from "../lib/leagueEngine";
import { useLeague } from "../context/LeagueContext";
import { PLAYER_FEATURES_ENABLED } from "../lib/releaseFeatures";
import { resolveClubPortalAccess } from "../lib/clubWorkspace";
import { loadPrivateLineups } from "../lib/leagueRepository";
import { navigate } from "../routes";
import { AccountPage } from "./AccountPage";
import { ClubProfileIdentity, ClubProfileOverview } from "./TeamPage";

export function ClubPortalPage({ previewClubId = null }) {
  const { league, standings, viewer, isDemoMode } = useLeague();
  const access = resolveClubPortalAccess(viewer, league.clubs, previewClubId);
  const { club, isPreview = false } = access;
  const fixtures = useMemo(() => club ? getClubFixtures(league.matchdays, club.id) : [], [club?.id, league.matchdays]);
  const nextFixture = club ? getNextClubFixture(league.matchdays, club.id) : null;
  const [formationMatchId, setFormationMatchId] = useState("");
  const [previewLineups, setPreviewLineups] = useState({ status: "idle", rows: [], clubId: null, viewerId: null });

  useEffect(() => {
    if (!fixtures.some((fixture) => fixture.id === formationMatchId)) setFormationMatchId(nextFixture?.id ?? fixtures[0]?.id ?? "");
  }, [formationMatchId, fixtures, nextFixture?.id]);

  useEffect(() => {
    let active = true;
    setPreviewLineups({ status: "idle", rows: [], clubId: null, viewerId: null });
    if (!isPreview || !club || !PLAYER_FEATURES_ENABLED || isDemoMode) return () => { active = false; };
    setPreviewLineups({ status: "loading", rows: [], clubId: club.id, viewerId: viewer.id });
    loadPrivateLineups({ clubId: club.id, league }).then((rows) => {
      if (active) setPreviewLineups({ status: "ready", rows: rows.filter((row) => row.clubId === club.id && fixtures.some((fixture) => fixture.id === row.matchId)), clubId: club.id, viewerId: viewer.id });
    }).catch(() => {
      if (active) setPreviewLineups({ status: "error", rows: [], clubId: club.id, viewerId: viewer.id });
    });
    return () => { active = false; };
  }, [isPreview, club?.id, viewer?.id, isDemoMode, fixtures, league]);

  if (access.status === "anonymous") return <><PageHero title="Mi equipo" description="Tu club, su plantilla y las alineaciones de cada jornada." /><Notice tone="info">Inicia sesión desde «Acceso clubes» para abrir tu equipo.</Notice></>;
  if (access.status === "password-change") return <AccountPage key={viewer.id} />;
  if (access.status === "forbidden") return <><PageHero title="Vista previa no disponible" /><Notice tone="warning">Solo administración puede visualizar otros equipos. <AppLink to="/club">Volver a mi equipo</AppLink></Notice></>;
  if (!club) return <><ClubAreaNavigation /><PageHero title={access.status === "unknown-club" ? "No se ha encontrado ese equipo" : "Tu cuenta no tiene equipo asignado"} /><Notice tone="info">{access.status === "unknown-club" ? <AppLink to="/club">Volver a mi equipo</AppLink> : "Administración debe revisar la membresía de tu cuenta."}</Notice></>;

  const players = league.players.filter((player) => player.clubId === club.id && player.status === "active");
  const formationMatch = fixtures.find((fixture) => fixture.id === formationMatchId) ?? nextFixture ?? fixtures[0] ?? null;
  const ownClub = league.clubs.find((candidate) => candidate.id === viewer.clubId);
  const previewDataMatches = previewLineups.clubId === club.id && previewLineups.viewerId === viewer.id;
  const lineups = isPreview && !isDemoMode ? (previewDataMatches ? previewLineups.rows : []) : league.lineups.filter((row) => row.clubId === club.id);
  return <>
    {!isPreview && <ClubAreaNavigation />}
    {viewer.role === "admin" && <section className={`club-preview-controls${isPreview ? " is-preview" : ""}`} aria-label="Vista de los presidentes">
      <label>Ver como usuario<select value={isPreview ? club.id : ""} onChange={(event) => navigate(event.target.value ? `/club?preview=${encodeURIComponent(event.target.value)}` : "/club")}>
        <option value="">Mi equipo{ownClub ? ` · ${ownClub.name}` : ""}</option>
        {league.clubs.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.founder} · {candidate.name}</option>)}
      </select></label>
      <div className="club-preview-description"><strong>{isPreview ? `Vista previa · ${club.name}` : "Vista de cada presidente"}</strong><p>{isPreview ? "Solo lectura. Sigues conectado con tu cuenta de administrador; no se enviarán cambios en nombre de este usuario." : "Selecciona un equipo para comprobar cómo ve su página el presidente."}</p></div>
      {isPreview && <div className="button-row"><AppLink className="button button-outline" to="/club">Volver a mi equipo</AppLink><AppLink className="button button-quiet" to="/club/admin">Volver al panel</AppLink></div>}
    </section>}
    <article className="club-profile-page club-portal-page" style={{ "--club-accent": club.color ?? "#3f7c35" }}>
      <ClubProfileIdentity club={club} />
      <ClubProfileOverview club={club} />
      <section className="club-portal-overview">
        <div className="panel"><SectionHeading title="Mi plantilla" />{PLAYER_FEATURES_ENABLED && players.length ? <div className="roster-list">{players.map((player) => <div key={player.id}><span>{player.shirtNumber ?? "—"}</span><strong>{player.name}</strong><small>{player.positionGroup === "GK" ? "Portero" : "Campo"}</small></div>)}</div> : <EmptyState title="Plantilla pendiente" description="Los jugadores de tu equipo aparecerán aquí cuando se incorporen." />}</div>
        <div className="panel"><SectionHeading title="Próximo partido" />{nextFixture ? <FixtureCard match={nextFixture} emphasize /> : <EmptyState title="Sin partidos pendientes" />}</div>
      </section>
      <section className="panel club-lineups-panel" aria-labelledby="club-lineups-title">
        <SectionHeading title="Alineaciones por jornada" id="club-lineups-title" />
        {fixtures.length > 0 && <div className="club-fixture-tabs" role="group" aria-label="Seleccionar jornada para la alineación">{fixtures.map((fixture) => <button type="button" className={fixture.id === formationMatch?.id ? "is-selected" : ""} aria-pressed={fixture.id === formationMatch?.id} onClick={() => setFormationMatchId(fixture.id)} key={fixture.id}>J{fixture.matchdayNumber}</button>)}</div>}
        {formationMatch && <div className="club-lineups-fixture"><FixtureCard match={formationMatch} showMatchday /></div>}
        {!PLAYER_FEATURES_ENABLED ? <EmptyState title="Alineaciones pendientes de habilitar" description="Cuando estén registrados los jugadores, podrás elegir la plantilla para cada jornada desde este apartado." />
          : !formationMatch ? <EmptyState title="Sin jornadas disponibles" />
          : isPreview && !isDemoMode && (!previewDataMatches || previewLineups.status === "loading" || previewLineups.status === "idle") ? <Notice tone="info">Cargando la alineación de este equipo…</Notice>
          : isPreview && previewLineups.status === "error" ? <Notice tone="warning">No se ha podido cargar la alineación de este equipo. Vuelve a seleccionar el equipo para reintentarlo.</Notice>
          : <FormationBuilder key={`${club.id}:${formationMatch.id}`} clubId={club.id} match={formationMatch} readOnly={isPreview || !access.canWrite} lineups={lineups} />}
      </section>
      <section className="content-section"><SectionHeading title="Calendario y resultados" />{fixtures.length ? <div className="fixture-grid compact-fixture-grid">{fixtures.map((fixture) => <FixtureCard match={fixture} key={fixture.id} showMatchday />)}</div> : <EmptyState title="Sin partidos registrados" />}</section>
      <section className="club-edition-section"><SectionHeading title="Clasificación" />{standings.length === 12 ? <div className="club-edition-standings-board"><OfficialStandingsBoard standings={standings} editionId="split-3" /></div> : <div className="panel"><StandingsTable standings={standings} compact /></div>}</section>
    </article>
  </>;
}
