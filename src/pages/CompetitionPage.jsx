import { Notice, PageHero, SectionHeading } from "../components/ui";
import { COMPETITION_RULES } from "../data/league";
import { useLeague } from "../context/LeagueContext";

export function CompetitionPage() {
  const { league } = useLeague();
  return (
    <>
      <PageHero eyebrow="Elite League" title="La competición" description="Un ecosistema competitivo de FC Rush donde la temporada regular, los resultados y los playoffs forman una historia única." meta={<span>{league.clubs.length} equipos · {league.matchdays.length} jornadas</span>} />
      <section className="competition-grid reveal-item">
        <article className="format-card"><p className="eyebrow">Temporada regular</p><strong>11 jornadas</strong><span>Todos contra todos a una vuelta. Cada partido alimenta la clasificación oficial.</span></article>
        <article className="format-card"><p className="eyebrow">En el campo</p><strong>4 + 1</strong><span>Cuatro jugadores de campo y un portero por equipo en cada jornada.</span></article>
        <article className="format-card"><p className="eyebrow">Puntuación</p><strong>3 · 2 · 1 · 0</strong><span>Victoria, victoria por penaltis, derrota por penaltis y derrota.</span></article>
      </section>
      <section className="two-column-page">
        <div className="panel reveal-item">
          <SectionHeading eyebrow="Formato" title="Camino al playoff" />
          <ol className="competition-timeline">
            <li><span>01</span><div><strong>Fase regular</strong><p>Las 11 jornadas determinan la posición de cada club.</p></div></li>
            <li><span>02</span><div><strong>Clasificación y desempates</strong><p>Puntos, diferencia de goles, goles a favor y victorias ordenan la tabla.</p></div></li>
            <li><span>03</span><div><strong>Eliminatorias configurables</strong><p>El bracket de cada split se administra sin fijar el formato en el código.</p></div></li>
            <li><span>04</span><div><strong>Campeón de Elite League</strong><p>La fase final decide el título de la temporada.</p></div></li>
          </ol>
        </div>
        <aside className="info-sidebar reveal-item">
          <div className="info-card"><p className="eyebrow">Reglas de puntuación</p><p>Victoria {COMPETITION_RULES.points.win} pts · Victoria por penaltis {COMPETITION_RULES.points.penaltyWin} pts · Derrota por penaltis {COMPETITION_RULES.points.penaltyLoss} pt.</p></div>
          <Notice tone="warning">{COMPETITION_RULES.playoff.note}</Notice>
          <Notice tone="info">El reglamento definitivo y las sanciones por tarjeta se publicarán desde esta misma sección cuando estén aprobados.</Notice>
        </aside>
      </section>
    </>
  );
}
