import { CLUBS_BY_ID, SEASON } from "../data/league";
import { publicSupabase, supabase } from "./supabase";
import { formatNewsDate, makeNewsSlug, newsPublicationDate, validateNewsInput } from "./news";

const publicBase = import.meta.env?.BASE_URL ?? "/";
const siteAsset = (path) => (path?.startsWith("/") ? `${publicBase}${path.slice(1)}` : path);

function getOne(value) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function toPublicClub(record) {
  const local = CLUBS_BY_ID[record.slug] ?? {};
  return {
    ...local,
    id: record.slug,
    databaseId: record.id,
    name: record.name,
    shortName: record.short_name,
    city: record.city ?? local.city ?? "",
    founded: record.founded_year?.toString() ?? local.founded ?? "",
    color: record.primary_color ?? local.color ?? "#63c75b",
    founder: record.founder_name ?? local.founder ?? "",
    representativeColors: record.representative_colors?.length ? record.representative_colors : local.representativeColors ?? [],
    honours: Array.isArray(record.competitive_honours) ? record.competitive_honours : local.honours ?? [],
    crest: siteAsset(record.crest_path) ?? local.crest,
  };
}

const NEWS_FIELDS = "id, slug, title, excerpt, body, category, cover_path, is_featured, published_at, created_at, updated_at";

function toPublicNews(record) {
  return {
    id: record.slug,
    databaseId: record.id,
    category: record.category,
    date: formatNewsDate(record.published_at),
    title: record.title,
    excerpt: record.excerpt,
    body: record.body ?? "",
    coverPath: record.cover_path ?? "",
    featured: record.is_featured,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function loadPublicLeague() {
  // Use anonymous RLS for this entire load, including nested results and events.
  const supabase = publicSupabase;
  if (!supabase) throw new Error("Supabase no está configurado.");

  const [{ data: phase, error: phaseError }, { data: clubRows, error: clubsError }, { data: newsRows, error: newsError }] = await Promise.all([
    supabase
      .from("competition_phases")
      .select("id, slug, name, rules, seasons!inner(id, slug, name, status)")
      .eq("phase_type", "regular")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("clubs").select("id, slug, name, short_name, city, founded_year, primary_color, representative_colors, founder_name, competitive_honours, crest_path").eq("is_active", true).order("name"),
    supabase.from("news_posts").select(NEWS_FIELDS).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }),
  ]);

  if (phaseError) throw phaseError;
  if (clubsError) throw clubsError;
  if (newsError) throw newsError;
  if (!phase) throw new Error("No hay una fase pública configurada todavía.");

  const [{ data: matchdayRows, error: matchdaysError }, { data: registrationRows, error: registrationsError }, { data: phaseClubRows, error: phaseClubsError }, { data: officialStandingRows, error: standingsError }] = await Promise.all([
    supabase
      .from("matchdays")
      .select("id, number, title, scheduled_for, status, matches(id, match_order, home_club_id, away_club_id, status, kickoff_at, lineup_deadline_at, public_at, match_results(home_score, away_score, home_penalty_score, away_penalty_score, published_at))")
      .eq("phase_id", phase.id)
      .order("number"),
    supabase
      .from("club_player_registrations")
      .select("id, club_id, shirt_number, position_group, status, players!inner(id, public_name)")
      .eq("phase_id", phase.id)
      .eq("status", "active"),
    supabase.from("phase_clubs").select("club_id").eq("phase_id", phase.id).eq("status", "active"),
    supabase.rpc("get_phase_standings", { p_phase_id: phase.id }),
  ]);
  if (matchdaysError) throw matchdaysError;
  if (registrationsError) throw registrationsError;
  if (phaseClubsError) throw phaseClubsError;
  if (standingsError) throw standingsError;

  const activePhaseClubIds = new Set((phaseClubRows ?? []).map((row) => row.club_id));
  const clubs = (clubRows ?? []).filter((club) => activePhaseClubIds.has(club.id)).map(toPublicClub);
  const slugByDatabaseId = new Map(clubs.map((club) => [club.databaseId, club.id]));
  const currentMatchdayNumber = (matchdayRows ?? []).find((matchday) => matchday.status === "current")?.number ?? matchdayRows?.[0]?.number ?? 1;
  const matchdays = (matchdayRows ?? []).map((matchday) => ({
    id: `phase-${phase.id}-j${matchday.number}`,
    databaseId: matchday.id,
    number: matchday.number,
    date: matchday.scheduled_for ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(matchday.scheduled_for)) : "Fecha pendiente",
    scheduledAt: matchday.scheduled_for,
    status: matchday.status,
    matches: (matchday.matches ?? [])
      .sort((a, b) => a.match_order - b.match_order)
      .map((match) => {
        const result = getOne(match.match_results);
        return {
          id: `match-${match.id}`,
          databaseId: match.id,
          matchdayId: `phase-${phase.id}-j${matchday.number}`,
          matchdayNumber: matchday.number,
          order: match.match_order,
          homeClubId: slugByDatabaseId.get(match.home_club_id),
          awayClubId: slugByDatabaseId.get(match.away_club_id),
          status: match.status,
          score: result ? { home: result.home_score, away: result.away_score } : null,
          penalties: result?.home_penalty_score == null ? null : { home: result.home_penalty_score, away: result.away_penalty_score },
          kickoff: match.kickoff_at,
          lineupDeadline: match.lineup_deadline_at,
          resultPublishedAt: result?.published_at ?? null,
        };
      }),
  }));
  const players = (registrationRows ?? []).map((registration) => ({
    id: `registration-${registration.id}`,
    registrationId: registration.id,
    playerId: getOne(registration.players)?.id,
    name: getOne(registration.players)?.public_name,
    clubId: slugByDatabaseId.get(registration.club_id),
    databaseClubId: registration.club_id,
    positionGroup: registration.position_group,
    shirtNumber: registration.shirt_number,
    status: registration.status,
  }));
  const clubByDatabaseId = new Map(clubs.map((club) => [club.databaseId, club]));
  const officialStandings = (officialStandingRows ?? [])
    .map((row) => ({
      club: clubByDatabaseId.get(row.club_id),
      position: row.position,
      played: row.played,
      wins: row.wins,
      penaltyWins: row.penalty_wins,
      penaltyLosses: row.penalty_losses,
      losses: row.losses,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goal_difference,
      points: row.points,
      form: [],
    }))
    .filter((row) => row.club);
  const databaseMatchIds = matchdays.flatMap((matchday) => matchday.matches.map((match) => match.databaseId));
  let eventRows = [];
  if (databaseMatchIds.length) {
    const { data, error } = await supabase
      .from("match_events")
      .select("id, match_id, event_type, registration_id, related_registration_id, club_id, minute, payload, created_at")
      .in("match_id", databaseMatchIds)
      .order("created_at");
    if (error) throw error;
    eventRows = data ?? [];
  }

  const frontendMatchIdByDatabaseId = new Map(
    matchdays.flatMap((matchday) => matchday.matches.map((match) => [match.databaseId, match.id])),
  );
  const playerIdByRegistrationId = new Map(players.map((player) => [player.registrationId, player.id]));
  const matchEvents = eventRows.map((event) => ({
    id: `event-${event.id}`,
    databaseId: event.id,
    matchId: frontendMatchIdByDatabaseId.get(event.match_id),
    eventType: event.event_type,
    playerId: playerIdByRegistrationId.get(event.registration_id),
    relatedPlayerId: playerIdByRegistrationId.get(event.related_registration_id),
    clubId: slugByDatabaseId.get(event.club_id),
    minute: event.minute,
    payload: event.payload ?? {},
    createdAt: event.created_at,
  }));

  return {
    season: {
      ...SEASON,
      id: phase.seasons?.slug ?? SEASON.id,
      databaseId: phase.seasons?.id,
      phaseId: phase.id,
      split: phase.name,
      currentMatchday: currentMatchdayNumber,
      status: phase.seasons?.status ?? "upcoming",
      competitionNotice: "Datos oficiales conectados a Elite League",
    },
    clubs,
    matchdays,
    players,
    lineups: [],
    matchEvents,
    officialStandings,
    news: (newsRows ?? []).map(toPublicNews),
    adminNews: [],
    auditEvents: [],
  };
}

export async function getProductionViewer(user) {
  if (!supabase || !user) return null;
  const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }, { data: clubs, error: clubsError }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, global_role, username, must_change_password").eq("id", user.id).maybeSingle(),
    supabase.from("club_memberships").select("club_id, role, created_at").eq("user_id", user.id).eq("is_active", true).order("created_at"),
    supabase.from("clubs").select("id, slug"),
  ]);
  if (profileError) throw profileError;
  if (membershipError) throw membershipError;
  if (clubsError) throw clubsError;
  const membership = memberships?.find((candidate) => candidate.role === "president") ?? memberships?.[0] ?? null;
  const slugById = new Map((clubs ?? []).map((club) => [club.id, club.slug]));
  return {
    id: user.id,
    name: profile?.display_name || profile?.username || "Usuario de Elite League",
    username: profile?.username ?? "",
    requiresPasswordChange: profile?.must_change_password ?? false,
    role: profile?.global_role === "admin" ? "admin" : membership?.role ?? "member",
    clubId: slugById.get(membership?.club_id) ?? null,
    source: "supabase",
  };
}

export async function loadPrivateLineups({ clubId, league }) {
  if (!supabase || !clubId) return [];
  const club = league.clubs.find((candidate) => candidate.id === clubId);
  if (!club?.databaseId) return [];
  const { data, error } = await supabase
    .from("lineup_submissions")
    .select("id, match_id, club_id, state, version, submitted_at, lineup_slots(registration_id)")
    .eq("club_id", club.databaseId);
  if (error) throw error;

  const playerIdByRegistration = new Map(league.players.map((player) => [player.registrationId, player.id]));
  return (data ?? []).map((lineup) => ({
    id: `lineup-${lineup.id}`,
    databaseId: lineup.id,
    matchId: `match-${lineup.match_id}`,
    clubId,
    playerIds: (lineup.lineup_slots ?? []).map((slot) => playerIdByRegistration.get(slot.registration_id)).filter(Boolean),
    state: lineup.state,
    submittedAt: lineup.submitted_at,
    version: lineup.version,
  }));
}

function describeAuditEvent(row) {
  const data = row.after_data ?? {};
  if (row.action === "result_confirmed") return `Resultado confirmado: ${data.home_score} — ${data.away_score}.`;
  if (row.action === "lineup_submitted") return "Formación 4+1 enviada.";
  if (row.action === "matchday_configured") return `Jornada configurada como ${data.status ?? "actualizada"}.`;
  if (row.action === "match_schedule_configured") return "Horario y límite de alineaciones actualizados.";
  if (row.action === "player_registered") return "Jugador registrado en la fase actual.";
  if (row.action === "news_published") return `Noticia publicada: ${data.title ?? "sin título"}.`;
  if (row.action === "news_draft_saved") return `Borrador guardado: ${data.title ?? "sin título"}.`;
  if (row.action === "news_updated") return `Noticia actualizada: ${data.title ?? "sin título"}.`;
  if (row.action === "news_withdrawn") return `Noticia retirada: ${data.title ?? "sin título"}.`;
  if (row.action === "news_deleted") return "Noticia eliminada; título conservado en el registro de auditoría del servidor.";
  if (row.action === "club_account_created") return `Cuenta de presidente creada: ${data.username ?? "usuario"}.`;
  if (row.action === "account_password_reset") return `Contraseña temporal restablecida: ${data.username ?? "usuario"}.`;
  if (row.action === "account_password_changed") return "El usuario ha cambiado su contraseña.";
  if (row.action === "match_event_recorded") return `Evento de partido registrado: ${data.event_type ?? "actualización"}.`;
  if (row.action === "president_invited") return `Invitación enviada a ${data.email ?? "presidencia"}.`;
  return "Cambio registrado en la competición.";
}

export async function loadProductionAuditEvents() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, after_data, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: `audit-${row.id}`,
    actor: "Administración",
    action: row.action,
    target: row.entity_id,
    detail: describeAuditEvent(row),
    at: row.created_at,
  }));
}

export async function saveProductionResult({ match, homeScore, awayScore, homePenalties, awayPenalties }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.rpc("confirm_match_result", {
    p_match_id: match.databaseId,
    p_home_score: Number(homeScore),
    p_away_score: Number(awayScore),
    p_home_penalty_score: homePenalties === "" || homePenalties == null ? null : Number(homePenalties),
    p_away_penalty_score: awayPenalties === "" || awayPenalties == null ? null : Number(awayPenalties),
  });
  if (error) throw error;
}

export async function configureProductionMatchday({ matchday, status, scheduledAt }) {
  if (!supabase || !matchday?.databaseId) throw new Error("No se ha podido identificar la jornada.");
  const { error } = await supabase.rpc("configure_matchday", {
    p_matchday_id: matchday.databaseId,
    p_status: status,
    p_scheduled_for: scheduledAt || null,
  });
  if (error) throw error;
}

export async function configureProductionMatchSchedule({ match, kickoff, lineupDeadline }) {
  if (!supabase || !match?.databaseId) throw new Error("No se ha podido identificar el partido.");
  const { error } = await supabase.rpc("configure_match_schedule", {
    p_match_id: match.databaseId,
    p_kickoff_at: kickoff || null,
    p_lineup_deadline_at: lineupDeadline || null,
  });
  if (error) throw error;
}

export async function saveProductionLineup({ match, players, state }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.rpc("submit_lineup", {
    p_match_id: match.databaseId,
    p_registration_ids: players.map((player) => player.registrationId),
    p_state: state,
  });
  if (error) throw error;
}

export async function createProductionPlayer({ name, club, phaseId, positionGroup, shirtNumber }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.rpc("register_player", {
    p_public_name: name.trim(),
    p_club_id: club.databaseId,
    p_phase_id: phaseId,
    p_position_group: positionGroup,
    p_shirt_number: shirtNumber ? Number(shirtNumber) : null,
  });
  if (error) throw error;
}

export async function loadProductionAdminNews() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.from("news_posts").select(NEWS_FIELDS).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPublicNews);
}

export async function saveProductionNews({ article, input, authorId }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { value, error: validationError } = validateNewsInput(input);
  if (validationError) throw new Error(validationError);
  const record = {
    title: value.title,
    excerpt: value.excerpt,
    body: value.body,
    category: value.category,
    cover_path: value.coverPath || null,
    is_featured: value.featured,
    published_at: newsPublicationDate(article, value.publish),
  };
  // Direct writes are covered by news_admin_manage; never use a service key in the browser.
  const query = article?.databaseId
    ? supabase.from("news_posts").update(record).eq("id", article.databaseId)
    : supabase.from("news_posts").insert({ ...record, slug: makeNewsSlug(value.title, crypto.randomUUID()), author_id: authorId });
  const { data, error } = await query.select(NEWS_FIELDS).single();
  if (error) throw error;
  return toPublicNews(data);
}

export async function createProductionMatchEvent({ match, player, eventType, minute }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  if (!match?.databaseId || !player?.registrationId) throw new Error("No se ha podido identificar el partido o jugador.");
  const { error } = await supabase.rpc("record_match_event", {
    p_match_id: match.databaseId,
    p_registration_id: player.registrationId,
    p_event_type: eventType,
    p_minute: minute == null || minute === "" ? null : Number(minute),
  });
  if (error) throw error;
}

export async function inviteProductionPresident({ email, displayName, club }) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  if (!club?.id) throw new Error("Selecciona un club válido.");
  const { data, error } = await supabase.functions.invoke("invite-president", {
    body: { email: email.trim(), displayName: displayName.trim(), clubSlug: club.id },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "No se ha podido enviar la invitación.");
  return data;
}
