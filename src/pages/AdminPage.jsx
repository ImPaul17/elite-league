import { useState } from "react";
import { MatchdayTabs } from "../components/competition";
import { MatchdayConfigurationForm, MatchEventForm, NewsEditorForm, PlayerRegistrationForm, ResultEditor } from "../components/operations";
import { EmptyState, Notice, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";
import { PLAYER_FEATURES_ENABLED } from "../lib/releaseFeatures";
import { ClubAccountManager } from "../components/ClubAccountManager";
import { AccountPage } from "./AccountPage";

export function AdminPage() {
  const { league, viewer, currentMatchday, resetDemo, isDemoMode } = useLeague();
  const [selectedNumber, setSelectedNumber] = useState(currentMatchday?.number ?? 1);
  if (viewer?.requiresPasswordChange) return <AccountPage key={viewer.id} />;
  if (!viewer || viewer.role !== "admin") {
    return <section className="protected-page"><PageHero eyebrow="Área protegida" title="Administración de Elite League" description="Este panel está reservado para la organización de la competición." /><Notice tone="warning">Inicia sesión con una cuenta de administración desde “Acceso clubes”.</Notice></section>;
  }
  const matchday = league.matchdays.find((item) => item.number === selectedNumber) ?? league.matchdays[0];
  return (
    <>
      <PageHero eyebrow="Organización" title="Panel de administración" description="Gestiona el calendario, los resultados, los accesos de los clubes y las noticias." meta={<span>{isDemoMode ? "Demostración local · no persistente" : "Conectado a producción"}</span>} />
      {isDemoMode && <Notice tone="info">Esta vista prueba el flujo completo en memoria. Con Supabase configurado, las mismas acciones se guardarán con permisos y auditoría en el servidor.</Notice>}
      <section className="admin-layout">
        <div className="admin-main">
          <div className="panel reveal-item"><SectionHeading eyebrow="Resultados" title="Confirmar jornada" /><MatchdayTabs matchdays={league.matchdays} selectedNumber={selectedNumber} onSelect={setSelectedNumber} /><div className="result-editor-list">{matchday.matches.map((match) => <ResultEditor match={match} key={match.id} />)}</div></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Calendario" title="Configurar jornada y plazos" /><MatchdayConfigurationForm matchday={matchday} /></div>
          {PLAYER_FEATURES_ENABLED ? <><div className="panel reveal-item"><SectionHeading eyebrow="Estadísticas" title="Registrar eventos de partido" /><MatchEventForm matchday={matchday} /></div><div className="panel reveal-item"><SectionHeading eyebrow="Jugadores" title="Registro de plantilla" /><PlayerRegistrationForm /></div></> : <div className="panel reveal-item"><SectionHeading title="Plantillas" /><EmptyState title="Incorporación de jugadores pendiente" description="El registro de jugadores, las alineaciones y los eventos individuales se habilitarán en la siguiente fase. El calendario y los resultados por equipo ya se pueden gestionar." /></div>}
          <div className="panel reveal-item"><SectionHeading eyebrow="Accesos" title="Usuarios de los clubes" /><ClubAccountManager key={viewer.id} /></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Contenido" title="Gestionar noticias" /><NewsEditorForm /></div>
        </div>
        <aside className="admin-side">
          <div className="info-card reveal-item"><p className="eyebrow">Estado de temporada</p><strong>{league.season.split}</strong><span>{league.clubs.length} clubes · {league.matchdays.length} jornadas</span></div>
          <div className="info-card reveal-item"><p className="eyebrow">Auditoría reciente</p>{league.auditEvents.length ? <ul className="audit-list">{league.auditEvents.slice(0, 6).map((event) => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><span>{event.detail}</span><small>{new Date(event.at).toLocaleString("es-ES")}</small></li>)}</ul> : <EmptyState title="Sin cambios todavía" description="Los resultados, jugadores y alineaciones registrados aparecerán aquí." />}</div>
          {isDemoMode && <button className="button button-outline button-danger" type="button" onClick={resetDemo}>Restaurar datos de demostración</button>}
        </aside>
      </section>
    </>
  );
}
