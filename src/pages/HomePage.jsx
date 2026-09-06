import { AppLink, EmptyState, PageHero, SectionHeading, StatusBadge } from "../components/ui";
import { NewsCard } from "../components/NewsContent";
import { OfficialMatchdayBoard, OfficialStandingsBoard, StatisticLeaderboard } from "../components/competition";
import { useLeague } from "../context/LeagueContext";
import { getStatisticLeaders } from "../lib/leagueEngine";
import { getPublishedNews } from "../lib/news";

export function HomePage() {
  const { league, standings, currentMatchday, playerStatistics, dataStatus } = useLeague();
  const news = getPublishedNews(league.news, { limit: 3 });
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
        {news.length ? <div className="news-grid news-public-grid">{news.map((article) => <NewsCard article={article} key={article.id} />)}</div>
          : dataStatus === "loading" ? <p role="status">Cargando noticias…</p>
            : <EmptyState title={dataStatus === "error" ? "No se han podido cargar las noticias" : "Todavía no hay noticias publicadas"} description={dataStatus === "error" ? "Puedes volver a intentarlo en la sección Noticias." : "Aquí aparecerán los próximos anuncios de Elite League."} />}
      </section>
    </>
  );
}
