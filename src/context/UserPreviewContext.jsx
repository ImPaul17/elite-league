import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeagueContext, useLeague } from "./LeagueContext";
import { manageClubAccount } from "../lib/clubAccounts";
import { loadPrivateLineups } from "../lib/leagueRepository";
import { PLAYER_FEATURES_ENABLED } from "../lib/releaseFeatures";
import { canStartUserPreview, createPreviewViewer, guardPreviewActions, previewWriteGuard, projectPreviewLeague } from "../lib/userPreview";
import { readClubWorkspaceRoute } from "../lib/clubWorkspace";
import { navigate, readHashRoute } from "../routes";
import "../components/user-preview.css";

const UserPreviewContext = createContext(null);

export function UserPreviewProvider({ children }) {
  const actual = useLeague();
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);
  const requestRef = useRef(0);
  const actualRef = useRef(actual);
  actualRef.current = actual;
  const allowed = canStartUserPreview(actual.viewer, actual.passwordRecovery);
  const active = Boolean(allowed && preview?.ownerId === actual.viewer?.id);
  const projectedViewer = active && preview.status === "ready"
    ? createPreviewViewer(preview.account, actual.league.clubs) : null;

  const stop = useCallback(() => {
    requestRef.current += 1;
    previewWriteGuard.setLocked(false);
    setPreview(null);
    setNotice(null);
    navigate("/club/admin");
  }, []);

  const start = useCallback(async (clubId) => {
    const origin = actualRef.current;
    if (!canStartUserPreview(origin.viewer, origin.passwordRecovery)) return;
    if (clubId === origin.viewer.clubId) { stop(); return; }
    const request = ++requestRef.current;
    const ownerId = origin.viewer.id;
    const isCurrent = () => request === requestRef.current && actualRef.current.viewer?.id === ownerId
      && canStartUserPreview(actualRef.current.viewer, actualRef.current.passwordRecovery);
    previewWriteGuard.setLocked(true);
    setNotice(null);
    setPreview({ ownerId, clubId, status: "loading" });
    try {
      const result = origin.isDemoMode ? { ok: true, accounts: origin.demoAccounts.map((account) => ({
        userId: account.id, name: account.name, username: account.id, clubId: account.clubId,
        isAdmin: account.role === "admin", requiresPasswordChange: false,
      })) } : await manageClubAccount("list");
      if (!isCurrent()) return;
      if (!result.ok) throw new Error(result.error);
      const account = result.accounts?.find((candidate) => candidate.clubId === clubId && !candidate.isAdmin);
      if (!createPreviewViewer(account, origin.league.clubs)) throw new Error("No se ha encontrado una cuenta de presidente activa para este equipo.");
      const lineups = origin.isDemoMode ? origin.league.lineups : PLAYER_FEATURES_ENABLED
        ? await loadPrivateLineups({ clubId, league: origin.league }) : [];
      if (!isCurrent()) return;
      setPreview({ ownerId, clubId, status: "ready", account, lineups,
        accounts: result.accounts.filter((candidate) => createPreviewViewer(candidate, origin.league.clubs)) });
      navigate("/club");
    } catch (error) {
      if (isCurrent()) setPreview({ ownerId, clubId, status: "error", error: error.message || "No se ha podido cargar la vista del usuario." });
    }
  }, [stop]);

  // Preview lives above routing: ordinary links do not end or reset it.
  // It is scoped to this tab's mounted administrator session, never persisted.
  useEffect(() => {
    requestRef.current += 1;
    previewWriteGuard.setLocked(false);
    setPreview(null);
    setNotice(null);
    return () => { requestRef.current += 1; previewWriteGuard.setLocked(false); };
  }, [actual.viewer?.id, allowed]);

  useEffect(() => {
    const followPreviewLink = () => {
      const clubId = readClubWorkspaceRoute(readHashRoute())?.previewClubId;
      if (clubId != null && allowed) start(clubId);
    };
    followPreviewLink();
    window.addEventListener("hashchange", followPreviewLink);
    return () => window.removeEventListener("hashchange", followPreviewLink);
  }, [allowed, actual.viewer?.id, start]);

  useEffect(() => {
    if (!active || !barRef.current) { setBarHeight(0); return; }
    const element = barRef.current;
    const resize = () => setBarHeight(element.getBoundingClientRect().height);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  const guardedActions = useMemo(() => guardPreviewActions(actual, previewWriteGuard,
    (message) => setNotice({ tone: "info", message })), [actual]);
  const value = useMemo(() => {
    if (!projectedViewer) return { ...actual, ...guardedActions, isUserPreview: false };
    return {
      ...actual,
      ...guardedActions,
      viewer: projectedViewer,
      league: projectPreviewLeague(actual.league, projectedViewer, preview.lineups),
      isUserPreview: true,
      passwordRecovery: false,
      demoAccounts: [],
      lastAction: notice,
      setLastAction: setNotice,
      signOut: () => { stop(); return { ok: true }; },
      canManageClub: (clubId) => !projectedViewer.requiresPasswordChange && clubId === projectedViewer.clubId,
      // Reload public/private data only through the real identity; never pass a
      // projected viewer into the authenticated session synchronizer.
      reloadProductionLeague: () => actualRef.current.reloadProductionLeague(actualRef.current.viewer),
    };
  }, [actual, guardedActions, projectedViewer, preview?.lineups, notice, stop]);
  const controls = { active, allowed, start, stop };

  return <UserPreviewContext.Provider value={controls}><div className={active ? "user-preview-shell" : undefined} style={active ? { "--user-preview-height": `${barHeight}px` } : undefined}>
    {active && <aside ref={barRef} className="user-preview-bar" aria-label="Vista de usuario en toda la web">
      <div className="shell user-preview-inner">
        <div className="user-preview-summary"><strong>{preview.status === "ready" ? `Viendo como ${preview.account.username}` : "Vista de usuario"}</strong><span>Toda la web · Solo lectura · Tu sesión de administrador sigue abierta</span></div>
        {preview.status === "ready" && <label className="user-preview-select"><span>Presidente</span><select aria-label="Presidente" value={preview.clubId} onChange={(event) => start(event.target.value)}>{preview.accounts.map((account) => <option key={account.userId} value={account.clubId}>{account.username}</option>)}</select></label>}
        <button className="button button-outline" type="button" onClick={stop}>Salir de vista de usuario</button>
      </div>
    </aside>}
    {active && !projectedViewer ? <main className="shell user-preview-loading" aria-live="polite">
      {preview.status === "error" ? <><p role="alert">{preview.error}</p><button className="button button-outline" onClick={() => start(preview.clubId)}>Reintentar</button></> : <p>Cargando la cuenta del presidente…</p>}
    </main> : <LeagueContext.Provider value={value}><div key={`${actual.viewer?.id ?? "anonymous"}:${projectedViewer?.id ?? "own"}`}>{children}</div></LeagueContext.Provider>}
  </div></UserPreviewContext.Provider>;
}

export function useUserPreview() {
  return useContext(UserPreviewContext);
}
