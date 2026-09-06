import { useState } from "react";
import { MatchdayTabs } from "../components/competition";
import { MatchdayConfigurationForm, MatchEventForm, NewsEditorForm, PlayerRegistrationForm, PresidentInviteForm, ResultEditor } from "../components/operations";
import { EmptyState, Notice, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";

export function AdminPage() {
  const { league, viewer, currentMatchday, resetDemo, isDemoMode } = useLeague();
  const [selectedNumber, setSelectedNumber] = useState(currentMatchday?.number ?? 1);
  if (!viewer || viewer.role !== "admin") {
    return <section className="protected-page"><PageHero eyebrow="Área protegida" title="Administración de Elite League" description="Este panel está reservado para la organización de la competición." /><Notice tone="warning">Necesitas iniciar el acceso de demostración como administrador para ver este flujo.</Notice></section>;
  }
  const matchday = league.matchdays.find((item) => item.number === selectedNumber) ?? league.matchdays[0];
  return (
    <>
      <PageHero eyebrow="Organización" title="Panel de administración" description="Gestiona jornadas, resultados, clubes, jugadores y trazabilidad operativa desde una sola zona." meta={<span>{isDemoMode ? "Demostración local · no persistente" : "Conectado a producción"}</span>} />
      {isDemoMode && <Notice tone="info">Esta vista prueba el flujo completo en memoria. Con Supabase configurado, las mismas acciones se guardarán con permisos y auditoría en el servidor.</Notice>}
      <section className="admin-layout">
        <div className="admin-main">
          <div className="panel reveal-item"><SectionHeading eyebrow="Resultados" title="Confirmar jornada" /><MatchdayTabs matchdays={league.matchdays} selectedNumber={selectedNumber} onSelect={setSelectedNumber} /><div className="result-editor-list">{matchday.matches.map((match) => <ResultEditor match={match} key={match.id} />)}</div></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Calendario" title="Configurar jornada y plazos" /><MatchdayConfigurationForm matchday={matchday} /></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Estadísticas" title="Registrar eventos de partido" /><MatchEventForm matchday={matchday} /></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Jugadores" title="Registro de plantilla" /><PlayerRegistrationForm /></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Accesos" title="Invitar presidente de club" /><PresidentInviteForm /></div>
          <div className="panel reveal-item"><SectionHeading eyebrow="Contenido" title="Publicar noticia" /><NewsEditorForm /></div>
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
