import { useEffect, useRef, useState } from "react";
import { useLeague } from "../context/LeagueContext";
import { EmptyState, Notice } from "./ui";
import { manageClubAccount } from "../lib/clubAccounts";
import { normalizeUsername, validUsername, temporaryPasswordError } from "../../supabase/functions/_shared/accountRules.js";

export function ClubAccountManager() {
  const { league, viewer, isDemoMode } = useLeague();
  const [accounts, setAccounts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [clubSlug, setClubSlug] = useState(league.clubs[0]?.id ?? "");
  const [password, setPassword] = useState("");
  const [resetId, setResetId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const activeRef = useRef(false);

  async function refresh() {
    setLoading(true);
    const result = await manageClubAccount("list");
    if (!activeRef.current) return;
    setLoading(false);
    setLoadError(result.ok ? "" : result.error);
    if (result.ok) setAccounts(result.accounts);
  }
  useEffect(() => {
    activeRef.current = true;
    if (!isDemoMode) refresh();
    else setLoading(false);
    return () => { activeRef.current = false; };
  }, [viewer.id, isDemoMode]);

  async function submit(event, action) {
    event.preventDefault();
    if (busyRef.current) return;
    const selectedPassword = action === "create" ? password : resetPassword;
    const validation = temporaryPasswordError(selectedPassword) || (action === "create" && !validUsername(normalizeUsername(username)) ? "Usa nombre.clubabreviado, en minúsculas y sin apellidos. Por ejemplo: pablo.pico." : "");
    if (validation) { setFeedback({ error: validation }); return; }
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await manageClubAccount(action, action === "create" ? { username, displayName, clubSlug, password } : { userId: resetId, password: resetPassword });
      if (!activeRef.current) return;
      setPassword("");
      setResetPassword("");
      if (!result.ok) { setFeedback(result); return; }
      setFeedback({ message: result.warning || (action === "create" ? `Cuenta ${result.username} creada para ${result.club}. Entrega el usuario y la contraseña temporal en privado; no se enviará ningún correo.` : "Contraseña temporal restablecida. El presidente deberá cambiarla al entrar.") });
      if (action === "create") { setUsername(""); setDisplayName(""); }
      setResetId("");
      await refresh();
    } finally { busyRef.current = false; if (activeRef.current) setBusy(false); }
  }

  if (isDemoMode) return <Notice tone="info">La creación y el restablecimiento de cuentas solo están disponibles en producción para administración. No se crean usuarios ficticios desde la demostración.</Notice>;
  return <div className="account-manager">
    <p>Usa nombre.clubabreviado, sin apellidos, tildes ni espacios. Entrega a cada persona una contraseña temporal distinta: seis números y una letra o símbolo al final. Tendrá que cambiarla antes de utilizar su panel.</p>
    <form className="stack-form" onSubmit={(event) => submit(event, "create")} aria-busy={busy}>
      <label>Nombre del presidente<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required disabled={busy} autoComplete="off" /></label>
      <label>Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={45} placeholder="pablo.pico" required disabled={busy} autoCapitalize="none" autoComplete="off" spellCheck={false} /></label>
      <label>Club<select value={clubSlug} onChange={(event) => setClubSlug(event.target.value)} required disabled={busy}>{league.clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
      <label>Contraseña temporal<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={7} maxLength={7} required disabled={busy} autoComplete="new-password" /></label>
      <button type="submit" className="button button-primary" disabled={busy || feedback?.partial}>{busy ? "Procesando…" : "Crear cuenta de presidente"}</button>
    </form>
    {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "form-error" : "notice notice-info"}>{feedback.error || feedback.message}</p>}
    <div className="account-manager-list">
      <h3>Cuentas de los clubes</h3>
      {loadError && <p role="alert" className="form-error">{loadError}</p>}
      <button className="text-button" type="button" disabled={busy || loading} onClick={refresh}>{loading ? "Cargando cuentas…" : "Actualizar cuentas"}</button>
      {!loading && !loadError && !accounts.length && <EmptyState title="Todavía no hay cuentas de presidentes" />}
      {accounts.map((account) => <div className="account-manager-row" key={`${account.userId}-${account.clubId}`}>
        <div><strong>{account.name || account.username}</strong><span>{account.username || "Usuario pendiente"} · {account.clubName}</span><small>{account.requiresPasswordChange ? "Cambio de contraseña pendiente" : "Cuenta preparada"}</small></div>
        {!account.isAdmin && account.username && account.userId !== viewer.id && <button className="button button-outline" type="button" disabled={busy} onClick={() => { setResetId(account.userId); setResetPassword(""); setFeedback(null); }}>Restablecer contraseña</button>}
        {resetId === account.userId && <form className="stack-form account-reset" onSubmit={(event) => submit(event, "reset")}>
          <p>Se sustituirá la contraseña de <strong>{account.username}</strong> y se exigirá cambiarla al entrar.</p>
          <label>Nueva contraseña temporal<input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={7} maxLength={7} required disabled={busy} autoComplete="new-password" /></label>
          <div className="button-row"><button className="button button-primary" type="submit" disabled={busy}>Confirmar restablecimiento</button><button className="button button-quiet" type="button" disabled={busy} onClick={() => { setResetId(""); setResetPassword(""); }}>Cancelar</button></div>
        </form>}
      </div>)}
    </div>
  </div>;
}
