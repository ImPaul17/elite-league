import { useEffect, useMemo, useState } from "react";
import { useLeague } from "../context/LeagueContext";
import { getMatchStatus, isOfficialResult } from "../lib/leagueEngine";
import { ClubCrest, EmptyState, Notice, StatusBadge } from "./ui";

export function FormationBuilder({ clubId, match }) {
  const { league, submitLineup, viewer, canManageClub } = useLeague();
  const club = league.clubs.find((candidate) => candidate.id === clubId);
  const players = useMemo(
    () => league.players.filter((player) => player.clubId === clubId && player.status === "active"),
    [clubId, league.players],
  );
  const existingLineup = league.lineups.find((lineup) => lineup.matchId === match.id && lineup.clubId === clubId);
  const [selectedIds, setSelectedIds] = useState(existingLineup?.playerIds ?? []);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedIds(existingLineup?.playerIds ?? []);
  }, [existingLineup?.id, match.id]);

  const selectedPlayers = players.filter((player) => selectedIds.includes(player.id));
  const selectedGoalkeepers = selectedPlayers.filter((player) => player.positionGroup === "GK");
  const selectedFieldPlayers = selectedPlayers.filter((player) => player.positionGroup === "FIELD");
  const deadline = match.lineupDeadline ? new Date(match.lineupDeadline) : null;
  const deadlinePassed = Boolean(deadline && deadline.getTime() <= Date.now() && viewer?.role !== "admin");

  function togglePlayer(playerId) {
    setMessage("");
    setSelectedIds((current) => {
      if (current.includes(playerId)) return current.filter((id) => id !== playerId);
      if (current.length >= 5) {
        setMessage("La alineación puede tener un máximo de cinco jugadores.");
        return current;
      }
      return [...current, playerId];
    });
  }

  async function save(state) {
    const result = await submitLineup({ matchId: match.id, clubId, playerIds: selectedIds, state });
    setMessage(result.ok ? "" : result.error);
  }

  if (!canManageClub(clubId)) {
    return <Notice tone="warning">Tu rol puede consultar el club, pero no enviar alineaciones. La gestión 4+1 está reservada a presidencia, staff autorizado y administración.</Notice>;
  }

  if (!players.length) {
    return (
      <EmptyState
        title="Tu club aún no tiene jugadores activos"
        description="Cuando administración cargue la plantilla, aquí podrás elegir cuatro jugadores de campo y un portero para cada jornada."
      />
    );
  }

  return (
    <div className="formation-builder">
      <div className="formation-summary">
        <div>
          <p className="eyebrow">Formación 4+1</p>
          <h3>{club.name}</h3>
          <p>Selecciona 1 portero y 4 jugadores de campo. La alineación se guarda como una instantánea del partido.</p>
        </div>
        <div className="formation-counts" aria-label="Conteo de jugadores seleccionados">
          <span><strong>{selectedGoalkeepers.length}</strong>/1 <small>POR</small></span>
          <span><strong>{selectedFieldPlayers.length}</strong>/4 <small>CAMPO</small></span>
        </div>
      </div>

      <div className="formation-layout">
        <div className="pitch-board" aria-label="Vista de la formación">
          <div className="pitch-line pitch-line-top" />
          <div className="pitch-circle" />
          <div className="pitch-line pitch-line-bottom" />
          <div className="pitch-slot pitch-slot-gk">{selectedGoalkeepers[0]?.name ?? "POR"}</div>
          {[0, 1, 2, 3].map((index) => (
            <div className={`pitch-slot pitch-slot-field pitch-slot-${index + 1}`} key={index}>
              {selectedFieldPlayers[index]?.name ?? `CAMPO ${index + 1}`}
            </div>
          ))}
        </div>
        <div className="player-picker">
          <p className="eyebrow">Jugadores disponibles</p>
          <div className="player-picker-list">
            {players.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <label className={`player-choice ${isSelected ? "is-selected" : ""}`} key={player.id}>
                  <input type="checkbox" checked={isSelected} onChange={() => togglePlayer(player.id)} />
                  <span className="player-number">{player.shirtNumber ?? "—"}</span>
                  <span><strong>{player.name}</strong><small>{player.positionGroup === "GK" ? "Portero" : "Jugador de campo"}</small></span>
                  <span className="choice-check">{isSelected ? "✓" : "+"}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
      {message && <p className="form-error" role="alert">{message}</p>}
      {deadline && <Notice tone={deadlinePassed ? "warning" : "info"}>{deadlinePassed ? "El plazo de alineaciones ha terminado. Contacta con administración si debe reabrirse." : `Límite para enviar la formación: ${deadline.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}.`}</Notice>}
      <div className="formation-actions">
        <span>{existingLineup ? `Versión ${existingLineup.version} · ${existingLineup.state === "draft" ? "borrador" : "enviada"}` : "Sin formación guardada"}</span>
        <div>
          <button className="button button-outline" type="button" onClick={() => save("draft")} disabled={deadlinePassed}>Guardar borrador</button>
          <button className="button button-primary" type="button" onClick={() => save("submitted")} disabled={deadlinePassed}>Enviar alineación</button>
        </div>
      </div>
      {viewer?.role === "admin" && <Notice tone="info">Como administrador, puedes revisar esta formación antes de que se conecte al flujo de bloqueo de la jornada.</Notice>}
    </div>
  );
}

export function ResultEditor({ match }) {
  const { league, updateMatchResult } = useLeague();
  const home = league.clubs.find((club) => club.id === match.homeClubId);
  const away = league.clubs.find((club) => club.id === match.awayClubId);
  const [form, setForm] = useState({
    homeScore: match.score?.home ?? "",
    awayScore: match.score?.away ?? "",
    homePenalties: match.penalties?.home ?? "",
    awayPenalties: match.penalties?.away ?? "",
  });
  const [error, setError] = useState("");
  const status = getMatchStatus(match);

  useEffect(() => {
    setForm({
      homeScore: match.score?.home ?? "",
      awayScore: match.score?.away ?? "",
      homePenalties: match.penalties?.home ?? "",
      awayPenalties: match.penalties?.away ?? "",
    });
    setError("");
  }, [match.id, match.penalties?.away, match.penalties?.home, match.score?.away, match.score?.home]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const result = await updateMatchResult({ matchId: match.id, ...form });
    if (!result.ok) setError(result.error);
  }

  return (
    <form className="result-editor" onSubmit={submit}>
      <div className="result-editor-meta">
        <span>J{String(match.matchdayNumber).padStart(2, "0")} · Partido {String(match.order).padStart(2, "0")}</span>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <div className="result-editor-clubs">
        <div><ClubCrest club={home} size="xs" decorative /><strong>{home.name}</strong></div>
        <div className="score-inputs">
          <label><span className="visually-hidden">Goles de {home.name}</span><input aria-label={`Goles de ${home.name}`} value={form.homeScore} inputMode="numeric" onChange={(event) => setField("homeScore", event.target.value)} /></label>
          <span>—</span>
          <label><span className="visually-hidden">Goles de {away.name}</span><input aria-label={`Goles de ${away.name}`} value={form.awayScore} inputMode="numeric" onChange={(event) => setField("awayScore", event.target.value)} /></label>
        </div>
        <div><ClubCrest club={away} size="xs" decorative /><strong>{away.name}</strong></div>
      </div>
      <div className="penalty-inputs">
        <span>Penaltis (solo si hay empate)</span>
        <label><span className="visually-hidden">Penaltis de {home.name}</span><input aria-label={`Penaltis de ${home.name}`} value={form.homePenalties} inputMode="numeric" onChange={(event) => setField("homePenalties", event.target.value)} /></label>
        <span>—</span>
        <label><span className="visually-hidden">Penaltis de {away.name}</span><input aria-label={`Penaltis de ${away.name}`} value={form.awayPenalties} inputMode="numeric" onChange={(event) => setField("awayPenalties", event.target.value)} /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-small" type="submit">Publicar resultado</button>
    </form>
  );
}

export function PlayerRegistrationForm() {
  const { league, addPlayer } = useLeague();
  const [form, setForm] = useState({ name: "", clubId: league.clubs[0]?.id ?? "", positionGroup: "FIELD", shirtNumber: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const result = await addPlayer(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setForm((current) => ({ ...current, name: "", shirtNumber: "" }));
  }

  return (
    <form className="player-registration-form" onSubmit={submit}>
      <label>Nombre<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del jugador" required /></label>
      <label>Club<select value={form.clubId} onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value }))}>{league.clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
      <label>Posición<select value={form.positionGroup} onChange={(event) => setForm((current) => ({ ...current, positionGroup: event.target.value }))}><option value="FIELD">Jugador de campo</option><option value="GK">Portero</option></select></label>
      <label>Dorsal<input value={form.shirtNumber} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, shirtNumber: event.target.value }))} placeholder="Opcional" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-small" type="submit">Añadir jugador</button>
    </form>
  );
}

export function NewsEditorForm() {
  const { addNews } = useLeague();
  const [form, setForm] = useState({ title: "", category: "Actualidad", excerpt: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const result = await addNews(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setForm({ title: "", category: "Actualidad", excerpt: "" });
  }

  return (
    <form className="news-editor-form" onSubmit={submit}>
      <label>Título<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Titular oficial" required /></label>
      <label>Categoría<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}><option>Actualidad</option><option>Competición</option><option>Clubes</option><option>Reglamento</option></select></label>
      <label>Resumen<textarea value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} placeholder="Texto visible en el listado de noticias" required rows="3" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-small" type="submit">Publicar noticia</button>
    </form>
  );
}

const EVENT_LABELS = {
  goal: "Gol",
  assist: "Asistencia",
  mvp: "MVP",
  yellow_card: "Tarjeta amarilla",
  blue_card: "Tarjeta azul",
  red_card: "Tarjeta roja",
};

export function MatchEventForm({ matchday }) {
  const { league, addMatchEvent } = useLeague();
  const confirmedMatches = useMemo(() => matchday.matches.filter(isOfficialResult), [matchday.matches]);
  const [form, setForm] = useState({ matchId: confirmedMatches[0]?.id ?? "", playerId: "", eventType: "goal", minute: "" });
  const [error, setError] = useState("");
  const match = confirmedMatches.find((candidate) => candidate.id === form.matchId) ?? confirmedMatches[0] ?? null;
  const availablePlayers = useMemo(
    () => league.players.filter((player) => player.status === "active" && (player.clubId === match?.homeClubId || player.clubId === match?.awayClubId)),
    [league.players, match?.awayClubId, match?.homeClubId],
  );

  useEffect(() => {
    if (!confirmedMatches.some((candidate) => candidate.id === form.matchId)) {
      setForm((current) => ({ ...current, matchId: confirmedMatches[0]?.id ?? "", playerId: "" }));
    }
  }, [confirmedMatches, form.matchId]);

  useEffect(() => {
    if (!availablePlayers.some((player) => player.id === form.playerId)) {
      setForm((current) => ({ ...current, playerId: availablePlayers[0]?.id ?? "" }));
    }
  }, [availablePlayers, form.playerId]);

  async function submit(event) {
    event.preventDefault();
    const result = await addMatchEvent(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setForm((current) => ({ ...current, minute: "" }));
  }

  if (!confirmedMatches.length) {
    return <EmptyState title="Confirma primero un resultado" description="Los goles, asistencias, tarjetas y MVP se pueden registrar cuando el marcador oficial ya está publicado." />;
  }

  return (
    <form className="match-event-form" onSubmit={submit}>
      <label>Partido<select value={form.matchId} onChange={(event) => setForm((current) => ({ ...current, matchId: event.target.value, playerId: "" }))}>{confirmedMatches.map((candidate) => { const home = league.clubs.find((club) => club.id === candidate.homeClubId); const away = league.clubs.find((club) => club.id === candidate.awayClubId); return <option value={candidate.id} key={candidate.id}>{home?.shortName ?? home?.name} — {away?.shortName ?? away?.name}</option>; })}</select></label>
      <label>Evento<select value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))}>{Object.entries(EVENT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Jugador<select value={form.playerId} onChange={(event) => setForm((current) => ({ ...current, playerId: event.target.value }))} required>{availablePlayers.length ? availablePlayers.map((player) => <option value={player.id} key={player.id}>{player.name} · {league.clubs.find((club) => club.id === player.clubId)?.shortName}</option>) : <option value="">Sin jugadores registrados</option>}</select></label>
      <label>Minuto<input value={form.minute} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, minute: event.target.value }))} placeholder="Opcional" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-small" type="submit" disabled={!availablePlayers.length}>Añadir evento</button>
    </form>
  );
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function MatchdayConfigurationForm({ matchday }) {
  const { league, updateMatchSchedule, updateMatchdayConfiguration } = useLeague();
  const [matchdayForm, setMatchdayForm] = useState({ status: matchday.status, scheduledAt: toDateTimeLocal(matchday.scheduledAt) });
  const [scheduleForm, setScheduleForm] = useState({ matchId: matchday.matches[0]?.id ?? "", kickoff: toDateTimeLocal(matchday.matches[0]?.kickoff), lineupDeadline: toDateTimeLocal(matchday.matches[0]?.lineupDeadline) });
  const [error, setError] = useState("");
  const selectedMatch = matchday.matches.find((match) => match.id === scheduleForm.matchId) ?? matchday.matches[0] ?? null;

  useEffect(() => {
    setMatchdayForm({ status: matchday.status, scheduledAt: toDateTimeLocal(matchday.scheduledAt) });
    setScheduleForm({ matchId: matchday.matches[0]?.id ?? "", kickoff: toDateTimeLocal(matchday.matches[0]?.kickoff), lineupDeadline: toDateTimeLocal(matchday.matches[0]?.lineupDeadline) });
    setError("");
  }, [matchday.id]);

  useEffect(() => {
    setScheduleForm((current) => ({
      ...current,
      kickoff: toDateTimeLocal(selectedMatch?.kickoff),
      lineupDeadline: toDateTimeLocal(selectedMatch?.lineupDeadline),
    }));
  }, [selectedMatch?.id, selectedMatch?.kickoff, selectedMatch?.lineupDeadline]);

  async function saveMatchday(event) {
    event.preventDefault();
    const result = await updateMatchdayConfiguration({ matchdayId: matchday.id, ...matchdayForm });
    if (!result.ok) setError(result.error);
    else setError("");
  }

  async function saveSchedule(event) {
    event.preventDefault();
    const result = await updateMatchSchedule(scheduleForm);
    if (!result.ok) setError(result.error);
    else setError("");
  }

  return (
    <div className="matchday-configuration">
      <form className="matchday-config-form" onSubmit={saveMatchday}>
        <label>Estado<select value={matchdayForm.status} onChange={(event) => setMatchdayForm((current) => ({ ...current, status: event.target.value }))}><option value="scheduled">Programada</option><option value="current">Jornada actual</option><option value="completed">Completada</option></select></label>
        <label>Fecha de la jornada<input type="datetime-local" value={matchdayForm.scheduledAt} onChange={(event) => setMatchdayForm((current) => ({ ...current, scheduledAt: event.target.value }))} /></label>
        <button className="button button-outline button-small" type="submit">Guardar jornada</button>
      </form>
      <form className="match-schedule-form" onSubmit={saveSchedule}>
        <label>Partido<select value={scheduleForm.matchId} onChange={(event) => setScheduleForm((current) => ({ ...current, matchId: event.target.value }))}>{matchday.matches.map((match) => { const home = league.clubs.find((club) => club.id === match.homeClubId); const away = league.clubs.find((club) => club.id === match.awayClubId); return <option value={match.id} key={match.id}>{home?.shortName ?? home?.name} — {away?.shortName ?? away?.name}</option>; })}</select></label>
        <label>Inicio<input type="datetime-local" value={scheduleForm.kickoff} onChange={(event) => setScheduleForm((current) => ({ ...current, kickoff: event.target.value }))} /></label>
        <label>Límite 4+1<input type="datetime-local" value={scheduleForm.lineupDeadline} onChange={(event) => setScheduleForm((current) => ({ ...current, lineupDeadline: event.target.value }))} /></label>
        <button className="button button-primary button-small" type="submit">Guardar horario</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

export function PresidentInviteForm() {
  const { league, invitePresident, isDemoMode } = useLeague();
  const [form, setForm] = useState({ displayName: "", email: "", clubId: league.clubs[0]?.id ?? "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const result = await invitePresident(form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setForm((current) => ({ ...current, displayName: "", email: "" }));
  }

  return (
    <form className="president-invite-form" onSubmit={submit}>
      {isDemoMode && <Notice tone="info">La invitación real se habilita cuando conectes Supabase y despliegues la función segura incluida en el proyecto.</Notice>}
      <label>Nombre<input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Nombre público" required /></label>
      <label>Correo<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="presidencia@club.com" required /></label>
      <label>Club<select value={form.clubId} onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value }))}>{league.clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-small" type="submit">Enviar invitación</button>
    </form>
  );
}
