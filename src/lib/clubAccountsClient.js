const ACCOUNT_ACCESS_ERROR = "Solo administración puede consultar las cuentas. Inicia sesión con tu cuenta de administrador y cambia primero la contraseña temporal si corresponde.";
const ACCOUNT_SESSION_ERROR = "Tu sesión no es válida o ha caducado. Vuelve a iniciar sesión para continuar.";
const ACCOUNT_CONNECTION_ERROR = "No se ha podido conectar con el servicio de cuentas. Revisa la conexión; si continúa, puede que el acceso desde esta dirección de la web no esté habilitado.";

// Use the signed-in client, not the public client or an administrative key.
// is_admin() checks the real identity and its password-change requirement;
// the following query is still subject to the database's row-level policies.
export async function listClubAccounts(client) {
  try {
    const { data: isAdmin, error: permissionError } = await client.rpc("is_admin");
    if (permissionError) return { ok: false, error: "No se han podido comprobar tus permisos de administrador. Vuelve a iniciar sesión o reintenta cuando se restablezca la conexión." };
    if (isAdmin !== true) return { ok: false, error: ACCOUNT_ACCESS_ERROR };

    const { data, error } = await client.from("club_memberships")
      .select("user_id, club_id, is_active, profiles!inner(id, display_name, username, must_change_password, global_role), clubs!inner(slug, name)")
      .eq("role", "president").eq("is_active", true);
    if (error || !Array.isArray(data)) return { ok: false, error: "No se han podido cargar las cuentas de los presidentes. Reintenta cuando se restablezca la conexión." };

    const accounts = data.map((row) => {
      const account = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const club = Array.isArray(row.clubs) ? row.clubs[0] : row.clubs;
      if (!account || !club) throw new Error("Incomplete account relationship");
      return {
        userId: row.user_id, name: account.display_name, username: account.username,
        requiresPasswordChange: account.must_change_password, isAdmin: account.global_role === "admin",
        clubId: club.slug, clubName: club.name,
      };
    });
    return { ok: true, accounts };
  } catch {
    return { ok: false, error: "No se han podido cargar las cuentas de los presidentes. Revisa la conexión e inténtalo de nuevo." };
  }
}

export async function describeClubAccountError(error) {
  let detail;
  try { detail = await (error?.context?.clone?.() ?? error?.context)?.json(); } catch { /* A gateway or network failure may not contain JSON. */ }
  const partial = detail?.partial === true;
  // The function's own messages are safe, purpose-written account errors. Do
  // not expose raw gateway messages, request bodies, tokens or database errors.
  if (typeof detail?.error === "string" && detail.error.trim()) return { ok: false, error: detail.error, partial };
  const status = error?.context?.status;
  let message;
  if (status === 401) message = ACCOUNT_SESSION_ERROR;
  else if (status === 403) message = "El servicio de cuentas ha rechazado el acceso. Comprueba que usas tu cuenta de administrador y una dirección autorizada de la web.";
  else if (status === 404) message = "El servicio de cuentas no está disponible en esta versión de la web. Contacta con administración.";
  else if (status === 429) message = "El servicio de cuentas ha recibido demasiadas solicitudes. Espera un momento antes de volver a intentarlo.";
  else if (status >= 500 || error?.name === "FunctionsRelayError") message = "El servicio de cuentas no está disponible temporalmente. No se ha podido confirmar la operación; comprueba su estado antes de repetirla.";
  else if (error?.name === "FunctionsFetchError") message = ACCOUNT_CONNECTION_ERROR;
  else message = "No se ha podido completar la operación de cuentas. No se ha confirmado el cambio; comprueba su estado antes de repetirla.";
  return { ok: false, error: message, partial };
}

// Writes stay in the authenticated Edge Function. Never automatically retry a
// password/account mutation: a lost response can follow a successful change.
export async function invokeClubAccountOperation(client, action, input = {}) {
  try {
    const { data, error } = await client.functions.invoke("club-accounts", { body: { ...input, action } });
    if (error) return describeClubAccountError(error);
    return data?.ok ? data : { ok: false, error: typeof data?.error === "string" ? data.error : "El servidor no ha confirmado la operación." };
  } catch {
    return { ok: false, error: ACCOUNT_CONNECTION_ERROR };
  }
}
