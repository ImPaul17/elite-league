import { siteAsset } from "../components/ui";
import { COMPETITION_RULES } from "../data/league";
import { SPLIT_3_PLAYOFF_QUALIFICATION, SPLIT_3_PLAYOFF_STAGES } from "../data/split3Playoffs";
import "./competition-page.css";

const scoring = [
  { key: "win", label: "Victoria" },
  { key: "penaltyWin", label: "Victoria por penaltis" },
  { key: "penaltyLoss", label: "Derrota por penaltis" },
  { key: "loss", label: "Derrota" },
];

export function CompetitionPage() {
  return (
    <article className="competition-page">
      <header className="competition-identity">
        <h1>
          <span className="visually-hidden">Elite League · Competición</span>
          <span className="competition-logo" aria-hidden="true" style={{ "--competition-logo-image": `url("${siteAsset("/logos/logo-elite-league.svg")}")` }} />
        </h1>
      </header>

      <div className="competition-info-grid">
        <section className="panel competition-info-card" aria-labelledby="competition-regular-title">
          <h2 className="eyebrow" id="competition-regular-title">Fase regular</h2>
          <p className="competition-key-figure">12 equipos<span>11 jornadas</span></p>
          <p>Los doce equipos disputan una liga de once jornadas, todos contra todos a una sola vuelta. Cada club se enfrenta una vez a los otros once.</p>
          <p>Se juegan seis partidos por jornada: un total de 66 encuentros que determinan la clasificación y el acceso a la fase final.</p>
          <p className="competition-card-note">FC Rush · Cuatro jugadores de campo y un portero por equipo.</p>
        </section>

        <section className="panel competition-info-card" aria-labelledby="competition-scoring-title">
          <h2 className="eyebrow" id="competition-scoring-title">Puntuación</h2>
          <dl className="competition-points">
            {scoring.map(({ key, label }) => <div key={key}>
              <dt>{label}</dt>
              <dd>{COMPETITION_RULES.points[key]}<span>{COMPETITION_RULES.points[key] === 1 ? "punto" : "puntos"}</span></dd>
            </div>)}
          </dl>
          <p className="competition-card-note">Si el partido termina en empate, la tanda de penaltis decide el ganador y el reparto de puntos.</p>
        </section>

        <section className="panel competition-info-card competition-playoffs-card" aria-labelledby="competition-playoffs-title">
          <h2 className="eyebrow" id="competition-playoffs-title">Fase final · Playoffs</h2>
          <p className="competition-playoffs-intro">Al terminar las once jornadas, los once primeros equipos acceden a la fase final. Su posición en la liga determina la ronda en la que comienzan.</p>
          <dl className="competition-qualification">
            {SPLIT_3_PLAYOFF_QUALIFICATION.map(({ id, label, round, description }) => <div key={id}>
              <dt>{label}</dt>
              <dd><h3>{round}</h3><p>{description}</p></dd>
            </div>)}
          </dl>
          <section className="competition-playoff-order" aria-labelledby="competition-playoff-order-title">
            <h3 id="competition-playoff-order-title">Cruces y orden de partidos</h3>
            <p>Las posiciones corresponden a la clasificación final de la fase regular. P significa partido: «Ganador P1» es quien gane el partido P1. En cada cruce, el local está a la izquierda y el visitante a la derecha.</p>
            <div className="competition-playoff-rounds">
              {SPLIT_3_PLAYOFF_STAGES.map((stage) => <section className="competition-playoff-round" key={stage.id} aria-labelledby={`competition-round-${stage.id}`}>
                <h4 id={`competition-round-${stage.id}`}>{stage.label}</h4>
                <ol className="competition-playoff-matches" start={stage.matches[0]?.order}>
                  {stage.matches.map((match) => <li className="competition-playoff-match" key={match.id} value={match.order} aria-label={`${match.code}: local, ${match.home.label}; visitante, ${match.away.label}`}>
                    <span className="competition-playoff-match-code" aria-hidden="true">{match.code}</span>
                    <span className="competition-playoff-side" aria-hidden="true">{match.home.label}</span>
                    <span className="competition-playoff-versus" aria-hidden="true">vs</span>
                    <span className="competition-playoff-side" aria-hidden="true">{match.away.label}</span>
                  </li>)}
                </ol>
              </section>)}
            </div>
          </section>
          <p className="competition-card-note">Los equipos se asignarán a estos cruces cuando termine la fase regular. El ganador de la final será el campeón de los playoffs.</p>
        </section>
      </div>
    </article>
  );
}
