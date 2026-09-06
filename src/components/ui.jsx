import { useEffect, useId, useState } from "react";
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
  const { demoAccounts, isDemoMode, passwordRecovery, requestPasswordReset, signInAsDemo, signInWithSupabase, updatePassword, viewer } = useLeague();
  const titleId = useId();
  const [accountId, setAccountId] = useState(demoAccounts[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

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
    const result = await signInWithSupabase(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleResetRequest(event) {
    event.preventDefault();
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setMode("login");
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const result = await updatePassword(password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setPassword("");
    setConfirmation("");
    onClose();
  }

  const dialogMode = passwordRecovery ? "new-password" : mode;
  const dialogTitle = dialogMode === "new-password" ? "Elige una nueva contraseña" : dialogMode === "reset" ? "Restablecer contraseña" : viewer ? "Cambiar acceso" : "Acceso a Elite League";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar acceso">×</button>
        <p className="eyebrow">Área privada</p>
        <h2 id={titleId}>{dialogTitle}</h2>
        <p className="dialog-description">{dialogMode === "new-password" ? "La invitación o el enlace de recuperación está verificado. Define una contraseña segura para continuar." : dialogMode === "reset" ? "Te enviaremos un enlace seguro al correo asociado a tu cuenta." : "Los clubes enviarán su alineación 4+1 y el administrador podrá gestionar toda la competición desde aquí."}</p>

        {dialogMode === "new-password" ? (
          <form className="stack-form" onSubmit={handlePasswordUpdate}>
            <label>Nueva contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete="new-password" autoFocus /></label>
            <label>Repite la contraseña<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength="8" autoComplete="new-password" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit">Guardar nueva contraseña</button>
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
          <form className="stack-form" onSubmit={handleResetRequest}>
            <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" autoFocus /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit">Enviar enlace de recuperación</button>
            <button className="text-button" type="button" onClick={() => { setError(""); setMode("login"); }}>Volver al acceso</button>
          </form>
        ) : (
          <form className="stack-form" onSubmit={handleProductionSubmit}>
            <label>
              Correo electrónico
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit">Iniciar sesión</button>
            <button className="text-button" type="button" onClick={() => { setError(""); setMode("reset"); }}>He olvidado mi contraseña</button>
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
      <header className="site-header">
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
          </nav>
          <div className="header-actions">
            {viewer ? (
              <div className="account-actions">
                <AppLink className="account-chip" to={viewer.role === "admin" ? "/admin" : "/club"}>
                  <span className="account-dot" />
                  <span>{viewer.role === "admin" ? "Administración" : "Mi club"}</span>
                </AppLink>
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
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
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
        </div>
        <small>© {new Date().getFullYear()} Elite League · Base preparada para gestión oficial.</small>
      </div>
    </footer>
  );
}
