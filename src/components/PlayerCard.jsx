import { siteAsset } from "./ui";
import { getPlayerCardStatistics, getPlayerDisplayName, getPlayerPositionLabel } from "../lib/playerProfile";
import "./player-card.css";

// Keep the Photoshop composition as real text and data, not a flattened card.
export function PlayerCard({ player, club, headingAs: Heading = "h3" }) {
  const name = getPlayerDisplayName(player);
  const statistics = getPlayerCardStatistics(player);
  const countryCode = ({ ES: "ESP", PT: "POR", CM: "CMR" })[player.nationalityCode] || player.nationalityCode;

  return <div className="player-card-shell">
    <div className={`player-card${player.isWildcard === true ? " player-card-wildcard" : ""}`}>
      {player.isWildcard === true && <span className="visually-hidden">Jugador comodín</span>}
      <div className="player-card-portrait">
        {player.portrait
          ? <img src={siteAsset(player.portrait)} alt={`Retrato de ${name}`} width="436" height="459" style={player.portraitScale ? { "--player-portrait-scale": player.portraitScale } : undefined} />
          : <span className="player-card-portrait-placeholder" aria-hidden="true">{name.charAt(0)}</span>}
      </div>
      <div className="player-card-identity">
        <div className="player-card-affiliations">
          <div className="player-card-nationality" aria-label={player.nationality}>
            {player.nationalityFlag && <img src={siteAsset(player.nationalityFlag)} alt="" width="512" height="512" />}
            <span aria-hidden="true">{countryCode}</span>
          </div>
          {club && <div className="player-card-club" aria-label={club.name}>
            {club.crest && <img src={club.crest} alt="" width="82" height="82" />}
            <span aria-hidden="true">{(club.shortName || club.name).slice(0, 3).toUpperCase()}</span>
          </div>}
        </div>
        <div className="player-card-heading">
          <Heading className={`player-card-name${name.length > 12 ? " player-card-name-compact" : ""}`}>{name}</Heading>
          <dl className="player-card-details">
            <div className="player-card-dorsal"><dt>Dorsal</dt><dd>{player.shirtNumber ?? "—"}</dd></div>
            <div className="player-card-position"><dt className="visually-hidden">Posición</dt><dd>{getPlayerPositionLabel(player)}</dd></div>
          </dl>
        </div>
        <dl className="player-card-rating"><dt>Media</dt><dd>{player.overall ?? "—"}</dd></dl>
      </div>
      <dl className="player-card-statistics" aria-label="Estadísticas de competición">
        {statistics.map((stat) => <div className={`player-card-stat player-card-stat-${stat.id}`} key={stat.id}>
          <dt>{stat.label}</dt><dd>{stat.value ?? "—"}</dd>
        </div>)}
      </dl>
    </div>
  </div>;
}
