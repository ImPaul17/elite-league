import { AppLink, EmptyState } from "./ui";
import { getClubPlayerProfiles } from "../data/playerProfiles";
import { getPlayerDisplayName } from "../lib/playerProfile";
import "./player-profile.css";

export function ClubRoster({ club, players = [], editionId = "split-3", privateView = false }) {
  const profiles = getClubPlayerProfiles(club.id, editionId);
  // Current registrations must not be presented as a historic squad.
  const registrations = editionId === "split-3" ? players : [];
  if (!profiles.length && !registrations.length) return <EmptyState title="Plantilla pendiente" description={privateView
    ? "Los jugadores de tu equipo aparecerán aquí cuando se incorporen."
    : "Los jugadores se añadirán cuando estén registrados."} />;

  return <div className="club-player-catalogue">
    {profiles.length > 0 && <div className="player-roster-grid">{profiles.map((player) => <AppLink
      to={`/jugadores/${player.slug}`} className="player-roster-card" key={player.id}
      aria-label={`Ver ficha de ${getPlayerDisplayName(player)}`}>
      <span className="player-roster-rating"><strong>{player.overall}</strong><small>{player.positions[0]}</small></span>
      <span className="player-roster-identity"><strong>{getPlayerDisplayName(player)}</strong><small>{player.nationality} · {player.jerseyName}</small></span>
      <span className="player-roster-number" aria-label={`Dorsal ${player.shirtNumber}`}>{String(player.shirtNumber).padStart(2, "0")}</span>
      <span className="player-roster-cta">Ver ficha del jugador <span aria-hidden="true">↗</span></span>
    </AppLink>)}</div>}
    {registrations.length > 0 && <div className="roster-list">{registrations.map((player) => <div key={player.id}>
      <span>{player.shirtNumber ?? "—"}</span><strong>{player.name}</strong><small>{player.positionGroup === "GK" ? "Portero" : "Jugador de campo"}</small>
    </div>)}</div>}
  </div>;
}
