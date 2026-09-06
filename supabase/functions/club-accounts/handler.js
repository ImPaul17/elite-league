import { accountIdentifier, normalizeUsername, validUsername, passwordError, temporaryPasswordError } from "../_shared/accountRules.js";

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function createAccountHandler({ createClient, getEnv }) {
return async (request) => {
  const allowedOrigins = (getEnv("ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
  const origin = request.headers.get("origin");
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || "https://eliteleague.qd.je"), "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
  const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.includes(origin)) return reply({ error: "Origen no permitido." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  const url = getEnv("SUPABASE_URL"), key = getEnv("SUPABASE_ANON_KEY"), serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !serviceKey) return reply({ error: "El servicio de cuentas no está configurado." }, 503);
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Inicia sesión para continuar." }, 401);
  const caller = createClient(url, key, { ...options, global: { headers: { Authorization: authorization } } });
  const service = createClient(url, serviceKey, options);
  try {
    const { data: identity, error: identityError } = await caller.auth.getUser();
    if (identityError || !identity.user) return reply({ error: "La sesión no es válida." }, 401);
    const user = identity.user;
    const { data: profile, error: profileError } = await service.from("profiles").select("id, global_role, username, must_change_password").eq("id", user.id).single();
    if (profileError || !profile) return reply({ error: "No se ha podido cargar el perfil. Revisa la migración de cuentas." }, 503);
    let payload;
    try { payload = await request.json(); } catch { return reply({ error: "Solicitud no válida." }, 400); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply({ error: "Solicitud no válida." }, 400);
    const action = payload.action;

    if (action === "change-password") {
      const validation = passwordError(payload.password);
      if (validation) return reply({ error: validation }, 400);
      if (!profile.username || !user.email || typeof payload.currentPassword !== "string") return reply({ error: "La cuenta todavía no está preparada para este acceso." }, 400);
      if (payload.password === payload.currentPassword) return reply({ error: "La nueva contraseña debe ser distinta de la actual." }, 400);
      // Reauthenticate using the existing password; never trust a caller-supplied user id.
      const verifier = createClient(url, key, options);
      const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: payload.currentPassword });
      if (verifyError || verified.user?.id !== user.id) return reply({ error: "La contraseña actual no es correcta." }, 400);
      await verifier.auth.signOut({ scope: "local" });
      const { error: passwordFailure } = await service.auth.admin.updateUserById(user.id, { password: payload.password });
      if (passwordFailure) return reply({ error: "No se ha podido cambiar la contraseña. Revisa sus requisitos." }, 400);
      const { error: readyError } = await service.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      if (readyError) return reply({ ok: true, warning: "La contraseña cambió, pero falta desbloquear la cuenta. Contacta con administración." });
      const { error: auditError } = await service.from("audit_logs").insert({ actor_id: user.id, action: "account_password_changed", entity_type: "profile", entity_id: user.id, after_data: {} });
      return reply({ ok: true, ...(auditError ? { warning: "La contraseña se ha cambiado, pero no se pudo registrar en auditoría. No repitas el cambio; avisa a administración." } : {}) });
    }

    if (profile.global_role !== "admin" || profile.must_change_password) return reply({ error: "Solo administración puede gestionar cuentas. Cambia primero tu contraseña temporal si corresponde." }, 403);

    if (action === "list") {
      const { data, error } = await service.from("club_memberships").select("user_id, club_id, is_active, profiles!inner(id, display_name, username, must_change_password, global_role), clubs!inner(slug, name)").eq("role", "president").eq("is_active", true);
      if (error) return reply({ error: "No se han podido cargar las cuentas." }, 500);
      return reply({ ok: true, accounts: (data || []).map((row) => {
        const account = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const club = Array.isArray(row.clubs) ? row.clubs[0] : row.clubs;
        return { userId: row.user_id, name: account.display_name, username: account.username, requiresPasswordChange: account.must_change_password, isAdmin: account.global_role === "admin", clubId: club.slug, clubName: club.name };
      }) });
    }

    if (action === "reset") {
      if (typeof payload.userId !== "string" || payload.userId === user.id) return reply({ error: "Para tu propia cuenta utiliza Cambiar contraseña." }, 400);
      const validation = temporaryPasswordError(payload.password);
      if (validation) return reply({ error: validation }, 400);
      const { data: target } = await service.from("profiles").select("id, username, global_role").eq("id", payload.userId).maybeSingle();
      const { data: member } = await service.from("club_memberships").select("id").eq("user_id", payload.userId).eq("role", "president").eq("is_active", true).limit(1);
      if (!target?.username || target.global_role === "admin" || !member?.length) return reply({ error: "Selecciona una cuenta activa de presidente que no sea administradora." }, 400);
      // Lock privileged writes before changing the credential; partial failure stays closed.
      const { error: lockError } = await service.from("profiles").update({ must_change_password: true }).eq("id", target.id);
      if (lockError) return reply({ error: "No se pudo preparar el restablecimiento." }, 500);
      const { error } = await service.auth.admin.updateUserById(target.id, { password: payload.password });
      if (error) return reply({ error: "No se ha cambiado la contraseña; la cuenta queda pendiente de cambio. Reintenta el restablecimiento." }, 500);
      const { error: auditError } = await service.from("audit_logs").insert({ actor_id: user.id, action: "account_password_reset", entity_type: "profile", entity_id: target.id, after_data: { username: target.username } });
      return reply({ ok: true, ...(auditError ? { warning: "La contraseña temporal ya está restablecida, pero falta su registro de auditoría. No repitas la operación." } : {}) });
    }

    if (action !== "create") return reply({ error: "Acción no válida." }, 400);
    const username = normalizeUsername(payload.username);
    const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
    const validation = temporaryPasswordError(payload.password);
    if (!validUsername(username) || !displayName || displayName.length > 80 || typeof payload.clubSlug !== "string") return reply({ error: "Revisa el usuario, nombre y club." }, 400);
    if (validation) return reply({ error: validation }, 400);
    const { data: club, error: clubError } = await service.from("clubs").select("id, name").eq("slug", payload.clubSlug).eq("is_active", true).maybeSingle();
    if (clubError || !club) return reply({ error: "No se ha encontrado ese club activo." }, 400);
    const { data: created, error: createError } = await service.auth.admin.createUser({ email: accountIdentifier(username), password: payload.password, email_confirm: true, user_metadata: { display_name: displayName } });
    if (createError || !created.user) return reply({ error: "No se ha podido crear la cuenta. Comprueba que el usuario esté disponible y la contraseña cumpla los requisitos." }, 400);
    const userId = created.user.id;
    const { error: updateError } = await service.from("profiles").update({ username, display_name: displayName, must_change_password: true }).eq("id", userId).select("id").single();
    if (updateError) return reply({ error: "La cuenta se creó, pero su perfil está incompleto. No vuelvas a crearla: administración debe revisar la cuenta en Supabase.", partial: true }, 500);
    const { error: membershipError } = await service.from("club_memberships").insert({ club_id: club.id, user_id: userId, role: "president", is_active: true });
    if (membershipError) return reply({ error: "La cuenta se creó, pero falta asignar el club en Supabase. No la crees de nuevo.", partial: true }, 500);
    const { error: auditError } = await service.from("audit_logs").insert({ actor_id: user.id, action: "club_account_created", entity_type: "profile", entity_id: userId, after_data: { username, club_id: club.id } });
    return reply({ ok: true, username, club: club.name, ...(auditError ? { warning: `La cuenta ${username} ya está creada, pero falta su registro de auditoría. No la crees de nuevo.` } : {}) });
  } catch {
    // Never log or return payloads: they contain plaintext credentials in transit.
    return reply({ error: "El servicio de cuentas no ha podido completar la operación." }, 500);
  }
};
}
