const STORAGE_KEY = "elite-league-verified-password-recovery";
const MAX_AGE_MS = 30 * 60 * 1000;

export function getPasswordRecoveryCallback(href) {
  if (!href) return null;
  const url = new URL(href);
  if (url.searchParams.get("setup") !== "recovery") return null;
  const hash = new URLSearchParams(url.hash.slice(1));
  return {
    hasCode: url.searchParams.has("code"),
    hasError: [url.searchParams, hash].some((params) => params.has("error") || params.has("error_description")),
  };
}

// This is a short-lived UI continuation marker, not an authentication token.
// Only the SDK's verified PASSWORD_RECOVERY event creates it; the URL cannot.
export function createPasswordRecoveryTracker({ storage, now = Date.now } = {}) {
  let verified;
  try { verified = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null"); } catch { verified = null; }

  function clear() {
    verified = null;
    try { storage?.removeItem(STORAGE_KEY); } catch { /* In-memory tracking still works. */ }
  }

  function isVerifiedFor(session) {
    if (!verified) return false;
    if (!session?.user?.id || verified.userId !== session.user.id || !Number.isFinite(verified.expiresAt) || verified.expiresAt <= now()) {
      clear();
      return false;
    }
    return true;
  }

  function handleAuthEvent(event, session) {
    if (event === "PASSWORD_RECOVERY" && session?.user?.id) {
      verified = { userId: session.user.id, expiresAt: now() + MAX_AGE_MS };
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(verified)); } catch { /* No reload continuation when storage is unavailable. */ }
    } else if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session?.user?.id)) {
      clear();
    } else if (session?.user?.id) {
      isVerifiedFor(session);
    }
  }

  return { clear, handleAuthEvent, isVerifiedFor };
}

export function createPasswordRecoveryInitializer(callback, { tracker, initializeAuth, getSession, clearUrl }) {
  // A new link must not inherit a previous account's verified recovery flow.
  if (callback?.hasCode || callback?.hasError) tracker.clear();
  let pending;
  return function initialize() {
    if (!callback) return Promise.resolve({ error: null });
    if (!pending) {
      pending = Promise.resolve().then(async () => {
        if (callback.hasError) throw new Error("El enlace de recuperación ha caducado o no es válido. Solicita uno nuevo.");
        const initialization = await initializeAuth();
        if (initialization.error) throw new Error("No se ha podido verificar el enlace de recuperación. Solicita uno nuevo y ábrelo en el navegador donde lo pediste.");
        const { data, error } = await getSession();
        if (error || !tracker.isVerifiedFor(data?.session)) {
          throw new Error("Este enlace no ha verificado una recuperación. Solicita uno nuevo y ábrelo en el navegador donde lo pediste.");
        }
        return { error: null };
      }).catch((error) => {
        tracker.clear();
        clearUrl();
        return { error };
      });
    }
    return pending;
  };
}
