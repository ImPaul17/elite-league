import { useRef, useState } from "react";
import { AppLink, Notice, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";
import { manageClubAccount } from "../lib/clubAccounts";
import { passwordError } from "../../supabase/functions/_shared/accountRules.js";

export function AccountPage() {
  const { viewer, isDemoMode, signOut, setLastAction } = useLeague();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  if (!viewer) return <><PageHero title="Mi cuenta" description="Gestiona tu contraseña y el acceso a tu club." /><Notice tone="info">Inicia sesión desde «Acceso clubes» con el usuario que te haya facilitado la organización.</Notice></>;

  async function changePassword(event) {
    event.preventDefault();
    if (busyRef.current) return;
    const validation = passwordError(password) || (password !== confirmation ? "Las contraseñas no coinciden." : "") || (password === currentPassword ? "La contraseña nueva debe ser distinta de la actual." : "");
    if (validation) { setFeedback({ error: validation }); return; }
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await manageClubAccount("change-password", { currentPassword, password });
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      if (!result.ok) { setFeedback(result); return; }
      const logout = await signOut();
      const message = result.warning || (logout.ok ? "Contraseña actualizada. Vuelve a iniciar sesión con la nueva contraseña." : "Contraseña actualizada. Cierra la sesión y vuelve a entrar con la nueva contraseña.");
      setFeedback({ message });
      setLastAction({ tone: result.warning || !logout.ok ? "warning" : "success", message });
    } finally { setBusy(false); busyRef.current = false; }
  }

  return <>
    <PageHero title="Mi cuenta" description={viewer.name} />
    {viewer.requiresPasswordChange && <Notice tone="warning">Antes de acceder al panel, cambia la contraseña temporal que te ha dado la organización.</Notice>}
    <section className="panel account-settings">
      <SectionHeading title="Cambiar contraseña" />
      <p>Usuario: <strong>{viewer.username || (isDemoMode ? "Demostración" : "Pendiente de asignación")}</strong></p>
      {isDemoMode ? <Notice tone="info">Las contraseñas solo se gestionan con una cuenta real. Esta demostración no modifica ninguna cuenta.</Notice> : <form className="stack-form" onSubmit={changePassword} aria-busy={busy}>
        <label>Contraseña actual<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required disabled={busy} /></label>
        <label>Nueva contraseña<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required disabled={busy} aria-describedby="password-help" /></label>
        <small id="password-help">Entre 12 y 128 caracteres. Puedes utilizar una frase que recuerdes.</small>
        <label>Repite la nueva contraseña<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required disabled={busy} /></label>
        {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "form-error" : "notice notice-info"}>{feedback.error || feedback.message}</p>}
        <button className="button button-primary" disabled={busy} type="submit">{busy ? "Guardando…" : "Guardar contraseña"}</button>
      </form>}
      {!viewer.requiresPasswordChange && <AppLink className="button button-outline" to={viewer.role === "admin" ? "/admin" : "/club"}>Volver a mi panel</AppLink>}
    </section>
  </>;
}
