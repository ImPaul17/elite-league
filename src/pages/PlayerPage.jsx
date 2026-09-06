import { AppLink, ClubCrest, SectionHeading } from "../components/ui";
import { formatPlayerBirthDate, getAttributeTone, getPlayerDisplayName, getPlayerFullName, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "../lib/playerProfile";
import "../components/player-profile.css";

function StarRating({ value }) {
  return <span className="player-star-rating" aria-label={`${value} de 5 estrellas`}>
    <span aria-hidden="true">{"★".repeat(value)}<span>{"★".repeat(5 - value)}</span></span>
    <small aria-hidden="true">{value}/5</small>
  </span>;
}

export function PlayerPage({ player, club }) {
  const displayName = getPlayerDisplayName(player);
  const fullName = getPlayerFullName(player);
  const summary = getPlayerSummary(player);
  const facts = [
    ["Nombre completo", fullName], ["Apodo", player.commonName || "Sin apodo"],
    ["Nombre en la camiseta", player.jerseyName || fullName],
    ["Fecha de nacimiento", formatPlayerBirthDate(player.birthDate)],
    ["Nacionalidad", player.nationality], ["Pierna preferida", player.preferredFoot],
    ["Pierna mala", <StarRating value={player.weakFoot} />], ["Filigranas", <StarRating value={player.skillMoves} />],
    ["Posiciones", player.positions.join(" · ")], ["Dorsal", player.shirtNumber],
  ];
  return <article className="player-profile-page">
    <AppLink to={`/equipos/${club.id}`} className="back-link">← Volver a {club.name}</AppLink>
    <div className="player-profile-intro">
      <header className="player-profile-hero panel">
        <AppLink to={`/equipos/${club.id}`} className="player-profile-club"><ClubCrest club={club} /><span>{club.name}</span></AppLink>
        <div className="player-profile-heading"><p className="eyebrow">Ficha del jugador · {player.game}</p><h1>{displayName}</h1>
          {displayName !== fullName && <p className="player-profile-fullname">{fullName}</p>}
          <div className="player-profile-tags"><span>{player.positionGroup === "GK" ? "Portero" : player.positions[0]}</span><span>Dorsal {player.shirtNumber}</span></div>
        </div>
        <div className="player-overall"><span>Media</span><strong>{player.overall}</strong><small>{player.positions[0]}</small></div>
        <span className="player-profile-watermark" aria-hidden="true">{String(player.shirtNumber).padStart(2, "0")}</span>
      </header>
      <section className="player-facts-panel panel" aria-labelledby="player-facts-title">
        <SectionHeading title="Datos del jugador" id="player-facts-title" />
        <dl className="player-profile-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
    </div>
    <section className="player-summary-section" aria-labelledby="player-summary-title">
      <SectionHeading title="Atributos principales" eyebrow={player.positionGroup === "GK" ? "Portero" : "Jugador de campo"} id="player-summary-title" />
      <div className="player-summary-grid">{summary.map((stat) => <div className="player-summary-tile" key={stat.id}>
        <span>{stat.label}</span>
        {stat.parts ? <><strong className="player-speed-values">{stat.parts[0].value}<i aria-hidden="true">/</i>{stat.parts[1].value}</strong><small>Acel. / Sprint</small></>
          : <><strong data-tone={getAttributeTone(stat.value)}>{stat.value ?? "—"}</strong><small>{stat.shortLabel}</small></>}
      </div>)}</div>
      {summary.some((stat) => stat.parts) && <p className="player-data-note">Velocidad: se muestran la aceleración y el sprint del archivo. Su valor global guardado no coincide con los atributos actualizados.</p>}
    </section>
    <section className="player-attributes-section" aria-labelledby="player-attributes-title">
      <SectionHeading title="Todos los atributos" eyebrow="Al detalle" id="player-attributes-title" />
      <div className="player-attribute-grid">{PLAYER_ATTRIBUTE_GROUPS.map((group) => <section className={`player-attribute-group panel${group.id === "goalkeeping" && player.positionGroup === "GK" ? " is-primary" : ""}`} key={group.id} aria-labelledby={`player-attributes-${group.id}`}>
        <h3 id={`player-attributes-${group.id}`}>{group.label}</h3>
        <dl>{group.attributes.map(([key, label]) => {
          const value = player.attributes[key];
          return <div className="player-attribute-row" key={key} data-attribute={key}>
            <dt>{label}</dt><dd data-tone={getAttributeTone(value)}>{value ?? "—"}</dd>
            <span className="player-attribute-meter" aria-hidden="true"><i style={{ width: `${Number.isFinite(value) ? value : 0}%` }} data-tone={getAttributeTone(value)} /></span>
          </div>;
        })}</dl>
      </section>)}</div>
    </section>
  </article>;
}
