import { AppLink, PageHero, SectionHeading, StatusBadge } from "../components/ui";
import { OfficialMatchdayBoard, OfficialStandingsBoard, StatisticLeaderboard } from "../components/competition";
import { useLeague } from "../context/LeagueContext";
import { getStatisticLeaders } from "../lib/leagueEngine";

export function HomePage() {
  const { league, standings, currentMatchday, playerStatistics } = useLeague();
  const scorers = getStatisticLeaders(playerStatistics, "goals", 3);
  const assistLeaders = getStatisticLeaders(playerStatistics, "assists", 3);
  const mvpLeaders = getStatisticLeaders(playerStatistics, "mvps", 3);

  return (
    <>
      <PageHero
        className="home-matchday-hero"
        eyebrow="Competición oficial · Split 3"
        title="Partidos de la jornada"
        description="Sigue los seis enfrentamientos de la jornada actual y consulta el calendario completo cuando lo necesites."
        meta={<><StatusBadge tone="current">Jornada {String(currentMatchday?.number ?? 1).padStart(2, "0")}</StatusBadge><AppLink to="/partidos" className="text-link">Calendario completo →</AppLink></>}
      >
        <OfficialMatchdayBoard matchday={currentMatchday} />
      </PageHero>

      <section className="home-primary-grid">
        <div className="panel panel-table reveal-item">
          <SectionHeading eyebrow="Split 3" title="Clasificación" action={<AppLink to="/clasificacion" className="text-link">Tabla completa →</AppLink>} />
          <OfficialStandingsBoard standings={standings} />
        </div>
      </section>

      <section className="content-section reveal-item">
        <SectionHeading eyebrow="Datos oficiales" title="Estadísticas del Split" action={<AppLink to="/estadisticas" className="text-link">Todas las estadísticas →</AppLink>} />
        <div className="leaderboard-grid">
          <StatisticLeaderboard title="Goleadores" description="Los líderes ofensivos se actualizan al registrar los goles oficiales." entries={scorers} metric="goals" metricLabel="G" />
          <StatisticLeaderboard title="Asistencias" description="Seguimiento de pases decisivos y jugadores determinantes." entries={assistLeaders} metric="assists" metricLabel="A" />
          <StatisticLeaderboard title="MVP" description="Reconocimientos individuales de cada jornada." entries={mvpLeaders} metric="mvps" metricLabel="MVP" />
        </div>
      </section>

      <section className="content-section reveal-item">
        <SectionHeading eyebrow="Actualidad" title="Últimas noticias" action={<AppLink to="/noticias" className="text-link">Ver todas →</AppLink>} />
        <div className="news-grid">
          {league.news.map((article) => (
            <article className={`news-card ${article.featured ? "is-featured" : ""}`} key={article.id}>
              <div className="news-card-mark"><span>{article.category}</span><small>{article.date}</small></div>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <AppLink to={`/noticias/${article.id}`} className="text-link">Leer noticia →</AppLink>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
