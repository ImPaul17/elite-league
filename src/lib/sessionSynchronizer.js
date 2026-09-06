// Auth callbacks must finish before profile/database requests start. A macrotask
// also lets INITIAL_SESSION, SIGNED_IN and the login form share one operation.
export function createSessionSynchronizer({ synchronize, onIdentityChange, onRecovery, onError }) {
  let active = true;
  let identity;
  let revision = 0;
  let operation;

  function cancelOperation() {
    if (!operation) return;
    clearTimeout(operation.timer);
    operation.resolve({ ok: false, error: "La sesión ha cambiado." });
  }

  function sync(event, session) {
    if (!active) return Promise.resolve({ ok: false, error: "La sesión ya no está activa." });
    const nextIdentity = session?.user?.id ?? null;
    const identityChanged = identity !== nextIdentity;

    if (identityChanged) {
      revision += 1;
      cancelOperation();
      operation = undefined;
      identity = nextIdentity;
      onIdentityChange();
    }
    if (nextIdentity && event === "PASSWORD_RECOVERY") onRecovery();
    if (operation && !operation.failed && event !== "USER_UPDATED") return operation.promise;

    revision += 1;
    cancelOperation();
    const currentRevision = revision;
    const isCurrent = () => active && currentRevision === revision;
    const nextOperation = { failed: false };
    nextOperation.promise = new Promise((resolve) => { nextOperation.resolve = resolve; });
    operation = nextOperation;
    nextOperation.timer = setTimeout(async () => {
      if (!isCurrent()) return;
      try {
        await synchronize(session, isCurrent);
        nextOperation.resolve(isCurrent() ? { ok: true } : { ok: false, error: "La sesión ha cambiado." });
      } catch (error) {
        nextOperation.failed = true;
        if (isCurrent()) onError(error);
        nextOperation.resolve({ ok: false, error: error?.message ?? "No se ha podido cargar la sesión." });
      }
    }, 0);
    return nextOperation.promise;
  }

  return {
    sync,
    dispose() {
      active = false;
      revision += 1;
      cancelOperation();
    },
  };
}
