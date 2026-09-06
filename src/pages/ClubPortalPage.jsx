import { useEffect, useMemo, useState } from "react";
import { FormationBuilder } from "../components/operations";
import { FixtureCard, StandingsTable } from "../components/competition";
import { AppLink, ClubCrest, EmptyState, Notice, PageHero, SectionHeading } from "../components/ui";
import { getClubFixtures, getNextClubFixture, isOfficialResult } from "../lib/leagueEngine";
import { useLeague } from "../context/LeagueContext";
import { PLAYER_FEATURES_ENABLED } from "../lib/releaseFeatures";
import { AccountPage } from "./AccountPage";

export function ClubPortalPage() {
  const { league, standings, viewer, isDemoMode, canManageClub } = useLeague();
  const club = viewer ? league.clubs.find((candidate) => candidate.id === viewer.clubId) : null;
  const nextFixture = club ? getNextClubFixture(league.matchdays, club.id) : null;
  const pendingFixtures = useMemo(
    () => club ? getClubFixtures(league.matchdays, club.id).filter((fixture) => !isOfficialResult(fixture)) : [],
    [club?.id, league.matchdays],
  );
  const [formationMatchId, setFormationMatchId] = useState("");

  useEffect(() => {
    if (!pendingFixtures.some((fixture) => fixture.id === formationMatchId)) setFormationMatchId(pendingFixtures[0]?.id ?? "");
  }, [formationMatchId, pendingFixtures]);

  if (!viewer) {
    return <section className="protected-page"><PageHero eyebrow="Área privada" title="Portal de clubes" description="Consulta la información de tu club, el calendario y sus resultados." /><Notice tone="warning">Inicia sesión desde “Acceso clubes” para abrir el portal de tu equipo.</Notice></section>;
  }
  if (viewer.requiresPasswordChange) return <AccountPage key={viewer.id} />;
  if (!club) {
    return <section className="protected-page"><PageHero eyebrow="Área privada" title="Tu acceso todavía no tiene club asignado" description="Administración debe vincular tu cuenta a un club antes de habilitar la gestión de plantilla y alineaciones." /><Notice tone="warning">La cuenta ha iniciado sesión, pero no tiene una membresía de club activa.</Notice></section>;
  }
  const fixtures = getClubFixtures(league.matchdays, club.id);
  const players = league.players.filter((player) => player.clubId === club.id && player.status === "active");
  const canManage = canManageClub(club.id);
  const formationMatch = pendingFixtures.find((fixture) => fixture.id === formationMatchId) ?? pendingFixtures[0] ?? null;
  return (
    <>
      <PageHero eyebrow={viewer.role === "admin" ? "Administrador + presidente" : "Portal del presidente"} title={club.name} description="Consulta el calendario, los resultados y la clasificación de tu equipo." meta={isDemoMode ? <span>Modo de demostración</span> : undefined}><div className="club-hero-crest" style={{ "--club-accent": club.color }}><ClubCrest club={club} size="xl" decorative /></div></PageHero>
      {viewer.role === "admin" && <Notice tone="info">Tienes acceso también al <AppLink to="/admin">panel de administración</AppLink> de la competición.</Notice>}
      <section className="two-column-page">
        <div className="panel reveal-item"><SectionHeading eyebrow="Siguiente compromiso" title="Próximo partido" />{nextFixture ? <FixtureCard match={nextFixture} emphasize /> : <EmptyState title="Sin partidos pendientes" />}</div>
        <div className="panel reveal-item"><SectionHeading title="Plantilla" />{PLAYER_FEATURES_ENABLED && players.length ? <div className="roster-list">{players.map((player) => <div key={player.id}><span>{player.shirtNumber ?? "—"}</span><strong>{player.name}</strong><small>{player.positionGroup === "GK" ? "Portero" : "Campo"}</small></div>)}</div> : <EmptyState title="Incorporación de jugadores pendiente" description="Las plantillas y las alineaciones se habilitarán en una próxima fase." />}</div>
      </section>
      <section className="content-section reveal-item"><SectionHeading title="Calendario y resultados" />{fixtures.length ? <div className="fixture-grid compact-fixture-grid">{fixtures.map((fixture) => <FixtureCard match={fixture} key={fixture.id} showMatchday />)}</div> : <EmptyState title="Sin partidos registrados" />}</section>
      {PLAYER_FEATURES_ENABLED && formationMatch && <section className="content-section reveal-item"><SectionHeading eyebrow={`Jornada ${String(formationMatch.matchdayNumber).padStart(2, "0")}`} title={canManage ? "Enviar formación" : "Formación"} />{pendingFixtures.length > 1 && <div className="club-fixture-tabs" aria-label="Seleccionar jornada para la formación">{pendingFixtures.map((fixture) => <button type="button" className={fixture.id === formationMatch.id ? "is-selected" : ""} onClick={() => setFormationMatchId(fixture.id)} key={fixture.id}>J{String(fixture.matchdayNumber).padStart(2, "0")}</button>)}</div>}<FormationBuilder clubId={club.id} match={formationMatch} /></section>}
      <section className="content-section reveal-item"><SectionHeading eyebrow="Contexto" title="Clasificación" /><div className="panel"><StandingsTable standings={standings} highlightClubId={club.id} compact /></div></section>
    </>
  );
}
