import { useEffect, useRef, useState } from "react";
import { useLeague } from "../context/LeagueContext";
import { AppLink, EmptyState, Notice } from "./ui";
import { manageClubAccount } from "../lib/clubAccounts";
import { generateTemporaryPassword } from "../lib/temporaryPassword";
import { temporaryPasswordError } from "../../supabase/functions/_shared/accountRules.js";
import "./clubAccounts.css";

export function ClubAccountManager() {
  const { league, viewer, isDemoMode } = useLeague();
  const [accounts, setAccounts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reset, setReset] = useState(null);
  const [visible, setVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const lifecycleRef = useRef(0);
  const resetRef = useRef(null);
  const canAdminister = viewer?.role === "admin" && !viewer.requiresPasswordChange;

  function clearReset() {
    resetRef.current = null;
    setReset(null);
    setVisible(false);
    setConfirmed(false);
    setCopyFeedback("");
    setFeedback(null);
  }

  async function refresh() {
    const lifecycle = lifecycleRef.current;
    setLoading(true);
    setLoadError("");
    const result = await manageClubAccount("list");
    if (lifecycle !== lifecycleRef.current) return;
    setLoading(false);
    setLoadError(result.ok ? "" : result.error);
    if (result.ok) setAccounts(result.accounts ?? []);
  }

  useEffect(() => {
    lifecycleRef.current += 1;
    clearReset();
    setAccounts([]);
    setLoadError("");
    if (canAdminister && !isDemoMode) refresh();
    else setLoading(false);
    // A temporary password lives only in this mounted view, never in storage.
    const discardOnLeave = () => clearReset();
    window.addEventListener("pagehide", discardOnLeave);
    return () => {
      lifecycleRef.current += 1;
      resetRef.current = null;
      window.removeEventListener("pagehide", discardOnLeave);
    };
  }, [viewer?.id, canAdminister, isDemoMode]);

  function startReset(account) {
    if (!canAdminister || isDemoMode || busyRef.current || account.isAdmin || account.userId === viewer.id || !account.username) return;
    clearReset();
    try {
      const nextReset = { userId: account.userId, username: account.username, password: generateTemporaryPassword(), completed: false };
      resetRef.current = nextReset;
      setReset(nextReset);
    } catch (error) {
      setFeedback({ error: error.message });
    }
  }

  async function copyPassword() {
    const selected = resetRef.current;
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.password);
      if (resetRef.current === selected) setCopyFeedback("Temporal copiada. Entrégala solo a esta persona y borra después el portapapeles.");
    } catch {
      if (resetRef.current === selected) setCopyFeedback("No se pudo copiar. Pulsa Mostrar temporal para copiarla manualmente.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    const selected = resetRef.current;
    if (!canAdminister || isDemoMode || busyRef.current || !selected || selected.completed || !confirmed || feedback?.partial) return;
    const account = accounts.find((item) => item.userId === selected.userId);
    if (!account || account.isAdmin || account.userId === viewer.id || !account.username) return;
    const validation = temporaryPasswordError(selected.password);
    if (validation) { setFeedback({ error: validation }); return; }
    const lifecycle = lifecycleRef.current;
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    setCopyFeedback("");
    try {
      const result = await manageClubAccount("reset", { userId: selected.userId, password: selected.password });
      if (lifecycle !== lifecycleRef.current || resetRef.current !== selected) return;
      if (!result.ok) {
        setConfirmed(false);
        setFeedback({ error: `${result.error} El restablecimiento no está confirmado; no entregues la temporal como un acceso válido.`, partial: result.partial });
        return;
      }
      const completed = { ...selected, completed: true };
      resetRef.current = completed;
      setReset(completed);
      setVisible(false);
      setFeedback({ message: result.warning || "Contraseña temporal restablecida. El presidente tendrá que cambiarla antes de gestionar su equipo." });
      await refresh();
    } finally {
      busyRef.current = false;
      if (lifecycle === lifecycleRef.current) setBusy(false);
    }
  }

  if (!canAdminister) return <Notice tone="warning">Solo administración puede consultar y restablecer los accesos. Cambia primero tu contraseña temporal si corresponde.</Notice>;

  const displayedAccounts = isDemoMode ? league.clubs.map((club) => ({
    userId: club.id === viewer.clubId ? viewer.id : `demo-president-${club.id}`,
    name: club.founder,
    username: `${(club.founder ?? "presidente").trim().split(/\s+/)[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.${club.shortName.toLowerCase()}`,
    clubId: club.id,
    clubName: club.name,
    isAdmin: club.id === viewer.clubId,
  })) : accounts;

  return <div className="account-manager club-account-controls">
    <p>Las contraseñas actuales son privadas y no se pueden consultar, tampoco desde administración. Si alguien pierde el acceso, puedes sustituir su contraseña por una temporal y verla o copiarla mientras mantengas abierto ese restablecimiento.</p>
    {isDemoMode && <Notice tone="info">Vista de demostración: puedes previsualizar los equipos, pero no restablecer contraseñas ni consultar accesos reales.</Notice>}
    <div className="account-manager-list">
      <div className="club-account-list-heading"><h3>Cuentas de los clubes</h3>{!isDemoMode && <button className="text-button" type="button" disabled={busy || loading} onClick={refresh}>{loading ? "Cargando cuentas…" : loadError ? "Reintentar carga" : "Actualizar cuentas"}</button>}</div>
      {loadError && <p role="alert" className="form-error">{loadError}</p>}
      {!loading && !loadError && !displayedAccounts.length && <EmptyState title="No hay cuentas de presidentes disponibles" />}
      {feedback && !reset && <p role="alert" className="form-error">{feedback.error}</p>}
      {displayedAccounts.map((account) => <div className="account-manager-row" key={`${account.userId}-${account.clubId}`}>
        <div className="club-account-details"><strong>{account.name || account.username}</strong><span>{account.username || "Usuario pendiente"} · {account.clubName}</span><small>{account.isAdmin ? "Administración · " : ""}{isDemoMode ? "Demostración" : account.requiresPasswordChange ? "Cambio de contraseña pendiente" : "Cuenta preparada"}</small></div>
        <div className="club-account-actions">
          <AppLink className="button button-quiet" to={`/club?preview=${encodeURIComponent(account.clubId)}`} aria-label={`Ver como usuario de ${account.clubName}`}>Ver como usuario</AppLink>
          {!account.isAdmin && account.username && account.userId !== viewer.id && <button className="button button-outline" type="button" disabled={busy || isDemoMode} onClick={() => startReset(account)}>Restablecer contraseña</button>}
          {account.userId === viewer.id && <AppLink className="text-button" to="/cuenta">Cambiar mi contraseña</AppLink>}
        </div>
        {reset?.userId === account.userId && <form className="stack-form account-reset club-account-reset" onSubmit={submit} aria-busy={busy}>
          <h4>{reset.completed ? "Temporal lista para entregar" : "Restablecer el acceso"} · {reset.username}</h4>
          {!reset.completed && <p>Se sustituirá su contraseña actual por esta temporal de seis números y un carácter. El usuario deberá cambiarla al entrar. Hasta que confirmes, no se modifica nada.</p>}
          <label>Contraseña temporal {reset.completed ? "confirmada" : "pendiente de aplicar"}<input type={visible ? "text" : "password"} value={reset.password} readOnly autoComplete="off" spellCheck={false} aria-describedby={`temporary-note-${account.userId}`} /></label>
          <div className="button-row"><button className="text-button" type="button" aria-pressed={visible} onClick={() => setVisible((value) => !value)}>{visible ? "Ocultar temporal" : "Mostrar temporal"}</button><button className="text-button" type="button" onClick={copyPassword}>Copiar temporal</button></div>
          {copyFeedback && <p className="club-account-copy-feedback" role="status">{copyFeedback}</p>}
          <p id={`temporary-note-${account.userId}`} className="club-account-secret-note">Al cerrar este apartado, salir de la página o elegir otra cuenta, la temporal dejará de mostrarse. No se guardará en el navegador ni se podrá recuperar desde este panel.</p>
          {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "form-error" : "notice notice-info"}>{feedback.error || feedback.message}</p>}
          {!reset.completed && <label className="club-account-reset-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={busy || feedback?.partial} /><span>Confirmo que quiero sustituir la contraseña de {reset.username}.</span></label>}
          <div className="button-row">
            {!reset.completed && <button className="button button-primary" type="submit" disabled={busy || !confirmed || feedback?.partial}>{busy ? "Restableciendo…" : "Confirmar restablecimiento"}</button>}
            <button className="button button-quiet" type="button" disabled={busy} onClick={clearReset}>{reset.completed ? "Cerrar y ocultar temporal" : "Cancelar"}</button>
          </div>
        </form>}
      </div>)}
    </div>
  </div>;
}
