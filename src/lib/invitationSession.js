export function getInvitationCallback(href) {
  if (!href) return null;
  const url = new URL(href);
  if (url.searchParams.get("setup") !== "invite") return null;
  const parameters = new URLSearchParams(url.hash.slice(1));
  if (parameters.has("error") || parameters.has("error_description")) {
    return { error: new Error(parameters.get("error_description") || "El enlace ha caducado o no es válido.") };
  }
  if (parameters.get("type") !== "invite" || !parameters.get("access_token") || !parameters.get("refresh_token")) return null;
  return {
    tokens: {
      access_token: parameters.get("access_token"),
      refresh_token: parameters.get("refresh_token"),
    },
  };
}

// inviteUserByEmail does not support PKCE. Consume its tokens explicitly while
// keeping the main client on PKCE for password recovery and other auth flows.
export function createInvitationSessionInitializer(callback, { setSession, clearUrl }) {
  let pending;
  return function initialize() {
    if (!callback) return Promise.resolve({ error: null });
    if (!pending) {
      pending = Promise.resolve().then(async () => {
        clearUrl();
        if (callback.error) return { error: callback.error };
        return await setSession(callback.tokens);
      }).catch((error) => ({ error }));
    }
    return pending;
  };
}
