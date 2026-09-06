import { useEffect, useId, useRef, useState } from "react";
import { NAVIGATION } from "../app/routes";
import { useLeague } from "../context/LeagueContext";

const publicBase = import.meta.env?.BASE_URL ?? "/";
export const siteAsset = (path) => `${publicBase}${path.replace(/^\//, "")}`;

export function AppLink({ to, children, className = "", onClick, ...props }) {
  const href = `#${to === "/" ? "/" : to}`;
  return (
    <a
      className={className}
      href={href}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  );
}

export function ClubCrest({ club, size = "md", decorative = false }) {
  if (!club) return <span className={`club-crest club-crest-${size} crest-fallback`} aria-hidden="true" />;
  const crestScale = club.crestScale ?? 1;
  return <img className={`club-crest club-crest-${size}`} src={club.crest} alt={decorative ? "" : `Escudo de ${club.name}`} style={club.crestScale ? { "--crest-scale": crestScale, "--crest-hover-scale": crestScale * 1.05 } : undefined} />;
}

export function StatusBadge({ tone = "scheduled", children }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, action, id }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
      </div>
      {action && <div className="section-heading-action">{action}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, meta, children, className = "" }) {
  return (
    <header className={`page-hero reveal-item ${className}`.trim()}>
      <div className="page-hero-grid" aria-hidden="true" />
      <div className="page-hero-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="hero-meta">{meta}</div>}
      </div>
      {children && <div className="page-hero-aside">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-mark" aria-hidden="true">+</span>
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
        {action && <div className="empty-state-action">{action}</div>}
      </div>
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}

export function ActionToast() {
  const { lastAction, setLastAction } = useLeague();

  useEffect(() => {
    if (!lastAction) return undefined;
    const timer = window.setTimeout(() => setLastAction(null), 5000);
    return () => window.clearTimeout(timer);
  }, [lastAction, setLastAction]);

  if (!lastAction) return null;
  return (
    <div className={`action-toast action-toast-${lastAction.tone}`} role="status">
      <span>{lastAction.message}</span>
      <button type="button" onClick={() => setLastAction(null)} aria-label="Cerrar aviso">×</button>
    </div>
  );
}

function AuthDialog({ isOpen, onClose }) {
  const { demoAccounts, isDemoMode, passwordRecovery, signInAsDemo, signInWithSupabase, updatePassword, viewer } = useLeague();
  const titleId = useId();
  const [accountId, setAccountId] = useState(demoAccounts[0]?.id ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dialogMode = passwordRecovery ? "new-password" : mode;

  useEffect(() => {
    if (!isOpen) return undefined;
    mountedRef.current = true;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]') ?? [])];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) (dialogRef.current?.querySelector("input, select") ?? dialogRef.current?.querySelector("button"))?.focus();
  }, [isOpen, dialogMode]);

  if (!isOpen) return null;

  async function handleDemoSubmit(event) {
    event.preventDefault();
    const result = signInAsDemo(accountId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleProductionSubmit(event) {
    event.preventDefault();
    await runRequest(() => signInWithSupabase(username, password), onClose);
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    await runRequest(() => updatePassword(password), () => {
      setPassword("");
      setConfirmation("");
      onClose();
    });
  }

  async function runRequest(action, onSuccess) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await action();
      if (!mountedRef.current) return;
      if (!result.ok) {
        const message = result.error || "No se ha podido completar la operación.";
        setError(/invalid login credentials/i.test(message) ? "El usuario o la contraseña no son correctos." : message);
      } else onSuccess();
    } catch {
      if (mountedRef.current) setError("No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.");
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  const dialogTitle = dialogMode === "new-password" ? "Elige una nueva contraseña" : dialogMode === "reset" ? "Restablecer contraseña" : viewer ? "Cambiar acceso" : "Acceso a Elite League";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar acceso">×</button>
        <p className="eyebrow">Área privada</p>
        <h2 id={titleId}>{dialogTitle}</h2>
        <p className="dialog-description">{dialogMode === "new-password" ? "Define una contraseña segura para continuar con tu cuenta." : dialogMode === "reset" ? "Pide a la organización que restablezca tu contraseña. Te dará una contraseña temporal que podrás cambiar al entrar." : "Introduce el usuario y la contraseña que te haya facilitado la organización."}</p>
        {success && <p className="notice notice-info" role="status">{success}</p>}

        {dialogMode === "new-password" ? (
          <form className="stack-form" onSubmit={handlePasswordUpdate}>
            <label>Nueva contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete="new-password" autoFocus /></label>
            <label>Repite la contraseña<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength="8" autoComplete="new-password" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar nueva contraseña"}</button>
          </form>
        ) : isDemoMode ? (
          <form className="stack-form" onSubmit={handleDemoSubmit}>
            <Notice tone="info">Modo de demostración: no hay contraseñas ni datos reales guardados en el navegador.</Notice>
            <label>
              Ver el portal como
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                {demoAccounts.map((account) => (
                  <option value={account.id} key={account.id}>{account.name}</option>
                ))}
              </select>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit">Abrir acceso de demostración</button>
          </form>
        ) : dialogMode === "reset" ? (
          <div className="stack-form">
            <button className="text-button" type="button" disabled={busy} onClick={() => { setError(""); setSuccess(""); setMode("login"); }}>Volver al acceso</button>
          </div>
        ) : (
          <form className="stack-form" onSubmit={handleProductionSubmit}>
            <label>
              Usuario
              <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={45} placeholder="nombre.club" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={busy} />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" disabled={busy} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Entrando…" : "Iniciar sesión"}</button>
            <button className="text-button" type="button" disabled={busy} onClick={() => { setError(""); setSuccess(""); setPassword(""); setMode("reset"); }}>He olvidado mi contraseña</button>
          </form>
        )}
      </section>
    </div>
  );
}

export function AppHeader({ activePath }) {
  const { viewer, signOut, league, passwordRecovery } = useLeague();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  function isActive(path) {
    if (path === "/") return activePath === "/";
    return activePath === path || activePath.startsWith(`${path}/`);
  }

  useEffect(() => {
    if (passwordRecovery) setIsAuthOpen(true);
  }, [passwordRecovery]);

  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <header className={`site-header${viewer ? " has-account" : ""}`}>
        <div className="header-main shell">
          <AppLink to="/" className="brand" aria-label="Elite League, inicio">
            <span
              className="brand-mark"
              aria-hidden="true"
              style={{ "--brand-mark-image": `url("${siteAsset("/logos/logo-elite-league.svg")}")` }}
            />
          </AppLink>
          <nav id="main-navigation" className={`main-navigation ${isMenuOpen ? "is-open" : ""}`} aria-label="Navegación principal">
            {NAVIGATION.map((item) => (
              <AppLink
                key={item.path}
                to={item.path}
                className={isActive(item.path) ? "is-active" : ""}
                aria-current={isActive(item.path) ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </AppLink>
            ))}
            {viewer && <div className="mobile-account-navigation">
              <AppLink to="/cuenta" onClick={() => setIsMenuOpen(false)}>Mi cuenta</AppLink>
              <button className="button button-quiet" type="button" onClick={async () => { const result = await signOut(); if (result.ok) setIsMenuOpen(false); }}>Cerrar sesión</button>
            </div>}
          </nav>
          <div className="header-actions">
            {viewer ? (
              <div className="account-actions">
                <AppLink className="account-chip" to={viewer.requiresPasswordChange ? "/cuenta" : viewer.role === "admin" ? "/admin" : "/club"}>
                  <span className="account-dot" />
                  <span>{viewer.role === "admin" ? "Administración" : "Mi club"}</span>
                </AppLink>
                <AppLink className="button button-quiet" to="/cuenta">Mi cuenta</AppLink>
                <button className="button button-quiet" type="button" onClick={signOut}>Salir</button>
              </div>
            ) : (
              <button className="button button-outline" type="button" onClick={() => setIsAuthOpen(true)}>Acceso clubes</button>
            )}
            <button className="menu-toggle" type="button" aria-expanded={isMenuOpen} aria-controls="main-navigation" onClick={() => setIsMenuOpen((open) => !open)}>
              <span />
              <span />
              <span className="visually-hidden">Abrir menú</span>
            </button>
          </div>
        </div>
        <nav className="club-rail" aria-label="Clubes de Elite League">
          <div className="club-rail-track shell">
            {league.clubs.map((club, index) => (
              <AppLink key={club.id} to={`/equipos/${club.id}`} className="club-rail-item" aria-label={`Abrir ficha de ${club.name}`} style={{ "--club-index": index }}>
                <ClubCrest club={club} size="sm" decorative />
              </AppLink>
            ))}
          </div>
        </nav>
      </header>
      {isAuthOpen && <AuthDialog isOpen onClose={() => setIsAuthOpen(false)} />}
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <img className="footer-logo" src={siteAsset("/logos/logo-elite-league.svg")} alt="Elite League" />
          <p>Competición oficial de FC Rush creada para que cada jornada cuente.</p>
        </div>
        <div className="footer-links">
          <AppLink to="/competicion">Formato y reglas</AppLink>
          <AppLink to="/partidos">Calendario</AppLink>
          <AppLink to="/noticias">Actualidad</AppLink>
          <AppLink to="/patrocinadores">Patrocinadores</AppLink>
        </div>
        <small>© {new Date().getFullYear()} Elite League</small>
      </div>
    </footer>
  );
}
