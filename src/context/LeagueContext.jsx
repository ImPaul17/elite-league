import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CLUBS_BY_ID, createLeagueSeed } from "../data/league";
import {
  calculatePlayerStatistics,
  calculateStandings,
  flattenMatches,
  getCurrentMatchday,
  isOfficialResult,
  validateLineup,
} from "../lib/leagueEngine";
import { clearVerifiedPasswordRecovery, hasVerifiedPasswordRecovery, initializeInvitationSession, initializePasswordRecoverySession, isSupabaseConfigured, supabase } from "../lib/supabase";
import { createSessionSynchronizer } from "../lib/sessionSynchronizer";
import {
  configureProductionMatchSchedule,
  configureProductionMatchday,
  createProductionMatchEvent,
  createProductionPlayer,
  getProductionViewer,
  loadProductionAuditEvents,
  loadProductionAdminNews,
  loadPrivateLineups,
  loadPublicLeague,
  saveProductionLineup,
  saveProductionResult,
  saveProductionNews,
} from "../lib/leagueRepository";
import { formatNewsDate, getPublishedNews, newsPublicationDate, validateNewsInput } from "../lib/news";
import { accountIdentifier } from "../../supabase/functions/_shared/accountRules.js";
import { validateMatchResultInput } from "../lib/matchResultInput";

export const LeagueContext = createContext(null);
const EVENT_TYPES = new Set(["goal", "assist", "mvp", "yellow_card", "blue_card", "red_card"]);
const MATCHDAY_STATUSES = new Set(["scheduled", "current", "completed"]);

const DEMO_ACCOUNTS = [
  {
    id: "demo-admin-pico",
    name: "Administrador · Pico FC",
    role: "admin",
    clubId: "pico-fc",
    description: "Acceso de organización y presidente de Pico FC",
  },
  ...Object.values(CLUBS_BY_ID)
    .filter((club) => club.id !== "pico-fc")
    .map((club) => ({
      id: `demo-president-${club.id}`,
      name: `Presidencia · ${club.name}`,
      role: "president",
      clubId: club.id,
      description: `Acceso de gestión para ${club.name}`,
    })),
];

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function appendAuditEvent(previous, event) {
  return [
    {
      id: createId("audit"),
      at: new Date().toISOString(),
      ...event,
    },
    ...previous,
  ].slice(0, 80);
}

function replaceMatch(matchdays, matchId, updater) {
  return matchdays.map((matchday) => ({
    ...matchday,
    matches: matchday.matches.map((match) => (match.id === matchId ? updater(match) : match)),
  }));
}

function displayScheduledDate(value) {
  if (!value) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function LeagueProvider({ children }) {
  const [league, setLeague] = useState(() => {
    const initialLeague = createLeagueSeed();
    if (isSupabaseConfigured) initialLeague.news = [];
    initialLeague.adminNews = [];
    return initialLeague;
  });
  const [viewer, setViewer] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [dataStatus, setDataStatus] = useState(() => isSupabaseConfigured ? "loading" : "demo");
  const viewerRef = useRef(null);
  const leagueRequestRef = useRef(0);
  const sessionSynchronizerRef = useRef(null);

  const matches = useMemo(() => flattenMatches(league.matchdays), [league.matchdays]);
  const clubsById = useMemo(() => Object.fromEntries(league.clubs.map((club) => [club.id, club])), [league.clubs]);
  const standings = useMemo(
    () => league.officialStandings?.length ? league.officialStandings : calculateStandings(league.clubs, matches),
    [league.clubs, league.officialStandings, matches],
  );
  const playerStatistics = useMemo(
    () => calculatePlayerStatistics(league.players, league.matchEvents ?? [], clubsById),
    [clubsById, league.matchEvents, league.players],
  );
  const currentMatchday = useMemo(
    () => getCurrentMatchday(league.matchdays, league.season.currentMatchday),
    [league.matchdays, league.season.currentMatchday],
  );

  const reloadProductionLeague = useCallback(async (viewerForPrivate = null) => {
    if (!supabase) return;
    // A mutation started before logout must not reload the previous user's data.
    if (viewerForPrivate && viewerForPrivate !== viewerRef.current) return;
    const requestId = ++leagueRequestRef.current;
    const isCurrent = () => requestId === leagueRequestRef.current;
    setDataStatus("loading");
    try {
      const publicLeague = await loadPublicLeague();
      if (!isCurrent()) return;
      if (viewerForPrivate?.clubId && !viewerForPrivate.requiresPasswordChange) {
        publicLeague.lineups = await loadPrivateLineups({ clubId: viewerForPrivate.clubId, league: publicLeague });
      }
      if (!isCurrent()) return;
      if (viewerForPrivate?.role === "admin" && !viewerForPrivate.requiresPasswordChange) {
        publicLeague.auditEvents = await loadProductionAuditEvents();
        if (!isCurrent()) return;
        publicLeague.adminNews = await loadProductionAdminNews();
      }
      if (!isCurrent()) return;
      setLeague(publicLeague);
      setDataStatus("ready");
    } catch (error) {
      if (!isCurrent()) return;
      const failure = new Error(`No se han podido cargar los datos oficiales: ${error?.message ?? "Error de conexión."}`);
      setDataStatus("error");
      setLastAction({ tone: "error", message: failure.message });
      throw failure;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let isActive = true;
    let listener;
    let invitedUserId = null;
    const synchronizer = createSessionSynchronizer({
      onIdentityChange() {
        leagueRequestRef.current += 1;
        viewerRef.current = null;
        setViewer(null);
        setPasswordRecovery(false);
        setLeague((previous) => ({ ...previous, lineups: [], auditEvents: [], adminNews: [] }));
      },
      onRecovery() { setPasswordRecovery(true); },
      async synchronize(session, isCurrent) {
        if (!session?.user) {
          await reloadProductionLeague();
          return;
        }
        const setupMode = new URLSearchParams(window.location.search).get("setup");
        if (hasVerifiedPasswordRecovery(session) || (setupMode === "invite" && session.user.id === invitedUserId)) setPasswordRecovery(true);
        let nextViewer;
        try {
          nextViewer = await getProductionViewer(session.user);
        } catch (error) {
          if (isCurrent()) {
            viewerRef.current = null;
            setViewer(null);
            setLeague((previous) => ({ ...previous, lineups: [], auditEvents: [], adminNews: [] }));
            // Keep public content available even when the private profile fails.
            await reloadProductionLeague().catch(() => {});
          }
          throw new Error(`No se ha podido cargar el perfil: ${error?.message ?? "Error de conexión."}`);
        }
        if (!isCurrent()) return;
        viewerRef.current = nextViewer;
        setViewer(nextViewer);
        await reloadProductionLeague(nextViewer);
      },
      onError(error) {
        setLastAction({ tone: "error", message: error?.message ?? "No se ha podido cargar la sesión." });
      },
    });
    sessionSynchronizerRef.current = synchronizer;
    // Resolve an invitation before exposing a previously saved account. The
    // initial auth event then supplies the accepted session without getSession.
    Promise.all([initializeInvitationSession(), initializePasswordRecoverySession()]).then(([{ data, error }, recovery]) => {
      if (!isActive) return;
      if (error) {
        setPasswordRecovery(false);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("setup");
        window.history.replaceState(window.history.state, "", cleanUrl.toString());
        setLastAction({ tone: "error", message: `No se ha podido aceptar la invitación: ${error.message}` });
      } else {
        invitedUserId = data?.session?.user?.id ?? null;
      }
      if (recovery.error) {
        setPasswordRecovery(false);
        setLastAction({ tone: "error", message: recovery.error.message });
      }
      listener = supabase.auth.onAuthStateChange((event, session) => {
        synchronizer.sync(event, session);
      }).data;
    });
    return () => {
      isActive = false;
      synchronizer.dispose();
      leagueRequestRef.current += 1;
      viewerRef.current = null;
      sessionSynchronizerRef.current = null;
      listener?.subscription.unsubscribe();
    };
  }, [reloadProductionLeague]);

  const signInAsDemo = useCallback((accountId) => {
    if (isSupabaseConfigured) return { ok: false, error: "El acceso de demostración está desactivado en el sitio oficial." };
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.id === accountId);
    if (!account) return { ok: false, error: "No se ha encontrado ese acceso de demostración." };
    setViewer(account);
    if (account.role !== "admin") setLeague((previous) => ({ ...previous, adminNews: [] }));
    setLastAction({ tone: "success", message: `Sesión de demostración iniciada: ${account.name}.` });
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      try {
        await initializeInvitationSession();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        sessionSynchronizerRef.current?.sync("SIGNED_OUT", null);
      } catch (error) {
        const message = `No se ha podido cerrar la sesión: ${error?.message ?? "Error de conexión."}`;
        setLastAction({ tone: "error", message });
        return { ok: false, error: message };
      }
    }
    clearVerifiedPasswordRecovery();
    setViewer(null);
    setLeague((previous) => ({ ...previous, adminNews: [] }));
    setPasswordRecovery(false);
    setLastAction({ tone: "neutral", message: "Sesión cerrada." });
    return { ok: true };
  }, []);

  const signInWithSupabase = useCallback(async (username, password) => {
    if (!supabase) {
      return { ok: false, error: "Supabase aún no está configurado. Usa el acceso de demostración para revisar los flujos." };
    }

    try {
      await initializeInvitationSession();
      const { data, error } = await supabase.auth.signInWithPassword({ email: accountIdentifier(username), password });
      if (error) return { ok: false, error: error.message };
      if (!data.session || !sessionSynchronizerRef.current) return { ok: false, error: "No se ha podido iniciar la sesión." };
      setPasswordRecovery(false);
      const result = await sessionSynchronizerRef.current.sync("SIGNED_IN", data.session);
      if (result.ok) window.location.hash = viewerRef.current?.requiresPasswordChange ? "/cuenta" : "/club";
      return result;
    } catch (error) {
      return { ok: false, error: error?.message ?? "No se ha podido conectar con el servicio de acceso." };
    }
  }, []);

  const updatePassword = useCallback(async (password) => {
    if (!supabase) return { ok: false, error: "Supabase aún no está configurado." };
    if (!password || password.length < 8) return { ok: false, error: "Usa una contraseña de al menos ocho caracteres." };
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { ok: false, error: error.message };
      clearVerifiedPasswordRecovery();
      setPasswordRecovery(false);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("setup");
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      setLastAction({ tone: "success", message: "Contraseña actualizada. Ya puedes acceder con ella." });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message ?? "No se ha podido actualizar la contraseña." };
    }
  }, []);

  const canManageClub = useCallback(
    (clubId) => Boolean(viewer && !viewer.requiresPasswordChange && (viewer.role === "admin" || (["president", "staff"].includes(viewer.role) && viewer.clubId === clubId))),
    [viewer],
  );

  const updateMatchResult = useCallback(
    async ({ matchId, homeScore, awayScore, homePenalties, awayPenalties, status = "confirmed" }) => {
      if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede publicar resultados oficiales." };
      const validated = validateMatchResultInput({ homeScore, awayScore, homePenalties, awayPenalties });
      if (!validated.ok) return validated;
      const { homeScore: parsedHome, awayScore: parsedAway, homePenalties: parsedHomePenalties, awayPenalties: parsedAwayPenalties } = validated;

      const targetMatch = matches.find((match) => match.id === matchId);
      if (!targetMatch) return { ok: false, error: "No se ha encontrado el partido seleccionado." };

      if (viewer.source === "supabase") {
        try {
          await saveProductionResult({
            match: targetMatch,
            homeScore: parsedHome,
            awayScore: parsedAway,
            homePenalties: parsedHomePenalties,
            awayPenalties: parsedAwayPenalties,
          });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: "Resultado publicado y clasificación recalculada en el servidor." });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      setLeague((previous) => {
        const updatedMatchdays = replaceMatch(previous.matchdays, matchId, (match) => ({
          ...match,
          status,
          score: { home: parsedHome, away: parsedAway },
          penalties: parsedHomePenalties == null ? null : { home: parsedHomePenalties, away: parsedAwayPenalties },
          resultPublishedAt: status === "confirmed" ? new Date().toISOString() : null,
        }));
        return {
          ...previous,
          matchdays: updatedMatchdays,
          auditEvents: appendAuditEvent(previous.auditEvents, {
            actor: viewer.name,
            action: "result_updated",
            target: matchId,
            detail: "Resultado actualizado desde el panel de administración.",
          }),
        };
      });
      setLastAction({ tone: "success", message: "Resultado guardado y clasificación recalculada." });
      return { ok: true };
    },
    [matches, reloadProductionLeague, viewer],
  );

  const updateMatchdayConfiguration = useCallback(
    async ({ matchdayId, status, scheduledAt }) => {
      if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede configurar jornadas." };
      if (!MATCHDAY_STATUSES.has(status)) return { ok: false, error: "Selecciona un estado de jornada válido." };
      const targetMatchday = league.matchdays.find((matchday) => matchday.id === matchdayId);
      if (!targetMatchday) return { ok: false, error: "No se ha encontrado la jornada seleccionada." };
      const dateValue = scheduledAt ? new Date(scheduledAt) : null;
      if (dateValue && Number.isNaN(dateValue.getTime())) return { ok: false, error: "La fecha de jornada no es válida." };
      const normalizedDate = dateValue?.toISOString() ?? null;

      if (viewer.source === "supabase") {
        try {
          await configureProductionMatchday({ matchday: targetMatchday, status, scheduledAt: normalizedDate });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: "Jornada actualizada en el calendario oficial." });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      setLeague((previous) => {
        const matchdays = previous.matchdays.map((matchday) => {
          if (matchday.id === matchdayId) return { ...matchday, status, scheduledAt: normalizedDate, date: displayScheduledDate(normalizedDate) };
          if (status === "current" && matchday.status === "current") return { ...matchday, status: "scheduled" };
          return matchday;
        });
        const current = matchdays.find((matchday) => matchday.status === "current") ?? matchdays.find((matchday) => matchday.status === "scheduled");
        return {
          ...previous,
          season: { ...previous.season, currentMatchday: current?.number ?? previous.season.currentMatchday },
          matchdays,
          auditEvents: appendAuditEvent(previous.auditEvents, {
            actor: viewer.name,
            action: "matchday_configured",
            target: matchdayId,
            detail: `Jornada ${targetMatchday.number} marcada como ${status}.`,
          }),
        };
      });
      setLastAction({ tone: "success", message: "Jornada actualizada en la demostración." });
      return { ok: true };
    },
    [league.matchdays, reloadProductionLeague, viewer],
  );

  const updateMatchSchedule = useCallback(
    async ({ matchId, kickoff, lineupDeadline }) => {
      if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede configurar partidos." };
      const targetMatch = matches.find((match) => match.id === matchId);
      if (!targetMatch) return { ok: false, error: "No se ha encontrado el partido seleccionado." };
      const kickoffValue = kickoff ? new Date(kickoff) : null;
      const deadlineValue = lineupDeadline ? new Date(lineupDeadline) : null;
      if ((kickoffValue && Number.isNaN(kickoffValue.getTime())) || (deadlineValue && Number.isNaN(deadlineValue.getTime()))) return { ok: false, error: "Revisa las fechas y horas introducidas." };
      const normalizedKickoff = kickoffValue?.toISOString() ?? null;
      const normalizedDeadline = deadlineValue?.toISOString() ?? null;
      if (normalizedKickoff && normalizedDeadline && new Date(normalizedDeadline) > new Date(normalizedKickoff)) return { ok: false, error: "El límite de alineaciones no puede ser posterior al inicio." };

      if (viewer.source === "supabase") {
        try {
          await configureProductionMatchSchedule({ match: targetMatch, kickoff: normalizedKickoff, lineupDeadline: normalizedDeadline });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: "Horario y límite de alineaciones actualizados." });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      setLeague((previous) => ({
        ...previous,
        matchdays: replaceMatch(previous.matchdays, matchId, (match) => ({ ...match, kickoff: normalizedKickoff, lineupDeadline: normalizedDeadline })),
        auditEvents: appendAuditEvent(previous.auditEvents, {
          actor: viewer.name,
          action: "match_schedule_configured",
          target: matchId,
          detail: "Horario y límite de alineaciones actualizados.",
        }),
      }));
      setLastAction({ tone: "success", message: "Horario actualizado en la demostración." });
      return { ok: true };
    },
    [matches, reloadProductionLeague, viewer],
  );

  const addPlayer = useCallback(
    async ({ name, clubId, positionGroup, shirtNumber }) => {
      if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede registrar jugadores." };
      const selectedClub = league.clubs.find((club) => club.id === clubId);
      if (!name?.trim() || !selectedClub) return { ok: false, error: "Completa nombre y club del jugador." };
      if (viewer.source === "supabase") {
        try {
          await createProductionPlayer({ name, club: selectedClub, phaseId: league.season.phaseId, positionGroup: positionGroup === "GK" ? "GK" : "FIELD", shirtNumber });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: `${name.trim()} se ha registrado en la base de datos.` });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      const player = {
        id: createId("player"),
        name: name.trim(),
        clubId,
        positionGroup: positionGroup === "GK" ? "GK" : "FIELD",
        shirtNumber: shirtNumber ? Number(shirtNumber) : null,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      setLeague((previous) => ({
        ...previous,
        players: [...previous.players, player],
        auditEvents: appendAuditEvent(previous.auditEvents, {
          actor: viewer.name,
          action: "player_created",
          target: player.id,
          detail: `Jugador registrado en ${selectedClub.name}.`,
        }),
      }));
      setLastAction({ tone: "success", message: `${player.name} se ha añadido a la plantilla de demostración.` });
      return { ok: true, player };
    },
    [league.clubs, league.season.phaseId, reloadProductionLeague, viewer],
  );

  const saveNews = useCallback(async ({ articleId, ...input }) => {
    if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede gestionar noticias." };
    const { value: normalized, error: validationError } = validateNewsInput(input);
    if (validationError) return { ok: false, error: validationError };
    const existing = articleId ? (league.adminNews ?? []).find((article) => article.id === articleId) : null;
    if (articleId && !existing) return { ok: false, error: "No se ha encontrado la noticia. Recarga el panel antes de editar." };

    let article;
    if (viewer.source === "supabase") {
      try {
        article = await saveProductionNews({ article: existing, input: normalized, authorId: viewer.id });
      } catch (error) {
        return { ok: false, error: error?.message ?? "No se ha podido guardar la noticia." };
      }
      // A session change while saving must not bring back private editorial data.
      if (viewerRef.current !== viewer) return { ok: false, error: "La sesión ha cambiado. Vuelve a entrar al panel para comprobar el guardado." };
    } else {
      const publishedAt = newsPublicationDate(existing, normalized.publish);
      article = { ...existing, ...normalized, id: existing?.id ?? createId("news"), publishedAt, date: formatNewsDate(publishedAt), updatedAt: new Date().toISOString() };
    }
    // Reflect the confirmed write immediately, including withdrawal, even if refresh fails.
    setLeague((previous) => ({
      ...previous,
      adminNews: [article, ...(previous.adminNews ?? []).filter((item) => item.id !== article.id)],
      news: getPublishedNews([article, ...previous.news.filter((item) => item.id !== article.id)]),
    }));
    let refreshWarning = "";
    if (viewer.source === "supabase") {
      try { await reloadProductionLeague(viewer); }
      catch { refreshWarning = "El guardado está confirmado, pero no se ha podido recargar el panel. Recarga antes de seguir editando."; }
    }
    const message = article.publishedAt ? "Noticia guardada y publicada." : "Borrador guardado. No es visible en la web pública.";
    setLastAction({ tone: refreshWarning ? "warning" : "success", message: refreshWarning || message });
    return { ok: true, article, warning: refreshWarning };
  }, [league.adminNews, reloadProductionLeague, viewer]);

  const addNews = saveNews;

  const addMatchEvent = useCallback(
    async ({ matchId, playerId, eventType, minute }) => {
      if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede registrar eventos oficiales." };
      if (!EVENT_TYPES.has(eventType)) return { ok: false, error: "Selecciona un tipo de evento válido." };

      const targetMatch = matches.find((match) => match.id === matchId);
      const player = league.players.find((candidate) => candidate.id === playerId);
      const parsedMinute = minute === "" || minute == null ? null : Number(minute);
      if (!targetMatch || !player) return { ok: false, error: "Selecciona un partido y un jugador válidos." };
      if (!isOfficialResult(targetMatch)) return { ok: false, error: "Confirma el resultado del partido antes de publicar sus eventos." };
      if (player.clubId !== targetMatch.homeClubId && player.clubId !== targetMatch.awayClubId) return { ok: false, error: "El jugador no pertenece a ninguno de los clubes de este partido." };
      if (parsedMinute != null && (!Number.isInteger(parsedMinute) || parsedMinute < 0 || parsedMinute > 99)) return { ok: false, error: "El minuto debe ser un número entero entre 0 y 99." };

      if (viewer.source === "supabase") {
        try {
          await createProductionMatchEvent({ match: targetMatch, player, eventType, minute: parsedMinute });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: "Evento oficial publicado; las estadísticas se han actualizado." });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      const event = {
        id: createId("event"),
        matchId,
        eventType,
        playerId,
        clubId: player.clubId,
        minute: parsedMinute,
        createdAt: new Date().toISOString(),
      };
      setLeague((previous) => ({
        ...previous,
        matchEvents: [...(previous.matchEvents ?? []), event],
        auditEvents: appendAuditEvent(previous.auditEvents, {
          actor: viewer.name,
          action: "match_event_created",
          target: event.id,
          detail: `${eventType.replaceAll("_", " ")} registrado para ${player.name}.`,
        }),
      }));
      setLastAction({ tone: "success", message: "Evento registrado; las estadísticas se han actualizado." });
      return { ok: true, event };
    },
    [league.players, matches, reloadProductionLeague, viewer],
  );

  const submitLineup = useCallback(
    async ({ matchId, clubId, playerIds, state = "submitted" }) => {
      if (!canManageClub(clubId)) return { ok: false, error: "No tienes permiso para gestionar esta alineación." };
      const selectedPlayers = league.players.filter((player) => playerIds.includes(player.id));
      const validationError = validateLineup({ players: selectedPlayers, clubId, matchId, matchdays: league.matchdays });
      if (validationError) return { ok: false, error: validationError };

      const targetMatch = matches.find((match) => match.id === matchId);
      if (!targetMatch) return { ok: false, error: "No se ha encontrado el partido seleccionado." };
      if (viewer.source === "supabase") {
        try {
          await saveProductionLineup({ match: targetMatch, players: selectedPlayers, state });
          await reloadProductionLeague(viewer);
          setLastAction({ tone: "success", message: state === "draft" ? "Borrador guardado en el servidor." : "Alineación enviada y registrada." });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }

      setLeague((previous) => {
        const existing = previous.lineups.findIndex((lineup) => lineup.matchId === matchId && lineup.clubId === clubId);
        const lineup = {
          id: existing >= 0 ? previous.lineups[existing].id : createId("lineup"),
          matchId,
          clubId,
          playerIds,
          state,
          submittedAt: new Date().toISOString(),
          submittedBy: viewer.id,
          version: existing >= 0 ? previous.lineups[existing].version + 1 : 1,
        };
        const lineups = existing >= 0
          ? previous.lineups.map((item, index) => (index === existing ? lineup : item))
          : [...previous.lineups, lineup];
        return {
          ...previous,
          lineups,
          auditEvents: appendAuditEvent(previous.auditEvents, {
            actor: viewer.name,
            action: "lineup_submitted",
            target: matchId,
            detail: `${clubsById[clubId]?.name ?? "El club"} ha enviado una formación 4+1.`,
          }),
        };
      });
      setLastAction({ tone: "success", message: state === "draft" ? "Borrador de alineación guardado." : "Alineación enviada para la jornada." });
      return { ok: true };
    },
    [canManageClub, clubsById, league.matchdays, league.players, matches, reloadProductionLeague, viewer],
  );

  const resetDemo = useCallback(() => {
    if (isSupabaseConfigured) return { ok: false, error: "Los datos de demostración están desactivados en el sitio oficial." };
    if (!viewer || viewer.role !== "admin") return { ok: false, error: "Solo administración puede restaurar la demostración." };
    setLeague(createLeagueSeed());
    setLastAction({ tone: "neutral", message: "Los datos de demostración se han restaurado." });
    return { ok: true };
  }, [viewer]);

  const value = useMemo(
    () => ({
      league,
      matches,
      clubsById,
      standings,
      playerStatistics,
      currentMatchday,
      viewer,
      passwordRecovery,
      dataStatus,
      demoAccounts: isSupabaseConfigured ? [] : DEMO_ACCOUNTS,
      isDemoMode: !isSupabaseConfigured,
      lastAction,
      setLastAction,
      signInAsDemo,
      signInWithSupabase,
      updatePassword,
      signOut,
      canManageClub,
      updateMatchResult,
      updateMatchdayConfiguration,
      updateMatchSchedule,
      addPlayer,
      addNews,
      saveNews,
      addMatchEvent,
      submitLineup,
      resetDemo,
      reloadProductionLeague,
    }),
    [
      league,
      matches,
      clubsById,
      standings,
      playerStatistics,
      currentMatchday,
      viewer,
      passwordRecovery,
      dataStatus,
      lastAction,
      signInAsDemo,
      signInWithSupabase,
      updatePassword,
      signOut,
      canManageClub,
      updateMatchResult,
      updateMatchdayConfiguration,
      updateMatchSchedule,
      addPlayer,
      addNews,
      saveNews,
      addMatchEvent,
      submitLineup,
      resetDemo,
      reloadProductionLeague,
    ],
  );

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
}

export function useLeague() {
  const value = useContext(LeagueContext);
  if (!value) throw new Error("useLeague debe utilizarse dentro de LeagueProvider.");
  return value;
}
