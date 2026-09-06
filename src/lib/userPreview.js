export const PREVIEW_READ_ONLY_MESSAGE = "Estás viendo la web como otro usuario en modo solo lectura. Sal de esta vista para realizar cambios con tu cuenta.";

export function canStartUserPreview(viewer, passwordRecovery = false) {
  return Boolean(viewer?.role === "admin" && !viewer.requiresPasswordChange && !passwordRecovery);
}

export function createPreviewViewer(account, clubs, afterPasswordChange = false) {
  if (!account?.userId || account.isAdmin || !account.username || !clubs.some((club) => club.id === account.clubId)) return null;
  return {
    id: account.userId,
    name: account.name || account.username,
    username: account.username,
    clubId: account.clubId,
    role: "president",
    requiresPasswordChange: Boolean(account.requiresPasswordChange && !afterPasswordChange),
    source: "preview",
  };
}

export function projectPreviewLeague(league, viewer, lineups = []) {
  const matches = new Set(league.matchdays.flatMap((day) => day.matches)
    .filter((match) => match.homeClubId === viewer.clubId || match.awayClubId === viewer.clubId)
    .map((match) => match.id));
  return {
    ...league,
    adminNews: [],
    auditEvents: [],
    lineups: viewer.requiresPasswordChange ? [] : lineups.filter((lineup) => lineup.clubId === viewer.clubId && matches.has(lineup.matchId)),
  };
}

// This is an extra client-side accident guard, not an authorization boundary.
// Supabase still authenticates the real administrator and enforces RLS.
export function createPreviewWriteGuard() {
  let locked = false;
  return {
    setLocked(value) { locked = Boolean(value); },
    isLocked() { return locked; },
    wrap(action, onBlocked = () => {}) {
      return (...args) => {
        if (!locked) return action(...args);
        onBlocked(PREVIEW_READ_ONLY_MESSAGE);
        return { ok: false, error: PREVIEW_READ_ONLY_MESSAGE };
      };
    },
  };
}

export const previewWriteGuard = createPreviewWriteGuard();
export const PREVIEW_BLOCKED_ACTIONS = [
  "signInAsDemo", "signInWithSupabase", "updatePassword", "signOut",
  "updateMatchResult", "updateMatchdayConfiguration", "updateMatchSchedule",
  "addPlayer", "addNews", "saveNews", "addMatchEvent", "submitLineup", "resetDemo",
];

export function guardPreviewActions(value, guard, onBlocked) {
  return Object.fromEntries(PREVIEW_BLOCKED_ACTIONS.map((name) => [name, guard.wrap(value[name], onBlocked)]));
}
