import { AppLink, EmptyState } from "./ui";
import { getClubPlayerProfiles } from "../data/playerProfiles";
import { getPlayerDisplayName, getPlayerPositionLabel } from "../lib/playerProfile";
import { getPlayerRosterGroup, PLAYER_ROSTER_GROUPS } from "../lib/playerPositions";
import { PlayerCard } from "./PlayerCard";
import "./player-profile.css";

export function ClubRoster({ club, players = [], editionId = "split-3", privateView = false }) {
  const profiles = getClubPlayerProfiles(club.id, editionId);
  // Current registrations must not be presented as a historic squad.
  const registrations = editionId === "split-3" ? players : [];
  if (!profiles.length && !registrations.length) return <EmptyState title="Plantilla pendiente" description={privateView
    ? "Los jugadores de tu equipo aparecerán aquí cuando se incorporen."
    : "Los jugadores se añadirán cuando estén registrados."} />;

  const groups = [...PLAYER_ROSTER_GROUPS];
  if ([...profiles, ...registrations].some((player) => !getPlayerRosterGroup(player))) {
    groups.push({ id: null, label: "Sin posición" });
  }

  return <div className="club-player-catalogue">
    {groups.map((group) => {
      const groupProfiles = profiles.filter((player) => getPlayerRosterGroup(player) === group.id);
      const groupRegistrations = registrations.filter((player) => getPlayerRosterGroup(player) === group.id);
      return <section className="player-roster-group" key={group.id ?? "unknown"} aria-label={group.label}>
        <h3 className="player-roster-group-title">{group.label}</h3>
        {groupProfiles.length > 0 && <div className="player-roster-grid">{groupProfiles.map((player) => <AppLink
          to={`/jugadores/${player.slug}`} className="player-roster-card" key={player.id}
          aria-label={`Ver ficha de ${getPlayerDisplayName(player)}`}>
          <PlayerCard player={player} club={club} headingAs="h4" />
        </AppLink>)}</div>}
        {groupRegistrations.length > 0 && <div className="roster-list">{groupRegistrations.map((player) => <div key={player.id}>
          <span>{player.shirtNumber ?? "—"}</span><strong>{player.name}</strong><small>{getPlayerPositionLabel(player)}</small>
        </div>)}</div>}
        {!groupProfiles.length && !groupRegistrations.length && <p className="player-roster-group-empty">Pendiente de jugadores.</p>}
      </section>;
    })}
  </div>;
}
