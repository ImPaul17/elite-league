import { siteAsset } from "../components/ui";
import { COMPETITION_RULES } from "../data/league";
import { SPLIT_3_PLAYOFF_QUALIFICATION } from "../data/split3Playoffs";
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
          <p className="competition-card-note">Los ganadores avanzan de ronda hasta la final, donde se decide el campeón de los playoffs.</p>
        </section>
      </div>
    </article>
  );
}
