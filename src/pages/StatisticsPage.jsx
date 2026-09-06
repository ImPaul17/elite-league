import { StatisticLeaderboard, StandingsTable } from "../components/competition";
import { EmptyState, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";
import { getStatisticLeaders, isOfficialResult } from "../lib/leagueEngine";

export function StatisticsPage() {
  const { standings, matches, playerStatistics } = useLeague();
  const completedMatches = matches.filter(isOfficialResult).length;
  const goals = matches.reduce((total, match) => total + (isOfficialResult(match) ? match.score.home + match.score.away : 0), 0);
  const scorers = getStatisticLeaders(playerStatistics, "goals");
  const assistLeaders = getStatisticLeaders(playerStatistics, "assists");
  const mvpLeaders = getStatisticLeaders(playerStatistics, "mvps");
  return (
    <>
      <PageHero eyebrow="Centro de datos" title="Estadísticas" description="Todos los datos se alimentarán de resultados oficiales y registros de partido, sin cálculos manuales en la web." meta={<><span>{completedMatches} partidos confirmados</span><span>{goals} goles registrados</span></>} />
      <section className="stat-summary-grid reveal-item">
        <div><span>Partidos</span><strong>{completedMatches}</strong></div>
        <div><span>Goles</span><strong>{goals}</strong></div>
        <div><span>Clubes</span><strong>{standings.length}</strong></div>
        <div><span>Eventos de jugador</span><strong>{playerStatistics.reduce((total, row) => total + row.goals + row.assists + row.mvps + row.yellowCards + row.blueCards + row.redCards, 0)}</strong></div>
      </section>
      <section className="content-section reveal-item">
        <SectionHeading eyebrow="Individuales" title="Líderes del Split 3" />
        <div className="leaderboard-grid">
          <StatisticLeaderboard title="Goleadores" description="Goles oficiales por jugador." entries={scorers} metric="goals" metricLabel="G" />
          <StatisticLeaderboard title="Asistencias" description="Asistencias confirmadas en cada encuentro." entries={assistLeaders} metric="assists" metricLabel="A" />
          <StatisticLeaderboard title="MVP" description="Reconocimientos individuales de la jornada." entries={mvpLeaders} metric="mvps" metricLabel="MVP" />
        </div>
      </section>
      <section className="two-column-page">
        <div className="panel reveal-item"><SectionHeading eyebrow="Equipos" title="Rendimiento global" /><StandingsTable standings={standings} compact /></div>
        <div className="panel reveal-item"><SectionHeading eyebrow="Próxima integración" title="Registro de eventos" /><EmptyState title="Aún no hay eventos de partido" description="El panel de administración podrá registrar goles, asistencias, tarjetas y premios al confirmar cada resultado." /></div>
      </section>
    </>
  );
}
