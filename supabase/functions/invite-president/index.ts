import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

type InvitePayload = {
  email?: string;
  displayName?: string;
  clubSlug?: string;
};

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigin = allowedOrigins.length ? (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]) : origin || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function response(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return response(request, { error: "Método no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/+$/, "");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !appUrl) return response(request, { error: "La función no está configurada." }, 500);

  const authorization = request.headers.get("Authorization") ?? "";
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) return response(request, { error: "Sesión no válida." }, 401);

  const { data: callerProfile, error: profileError } = await serviceClient
    .from("profiles")
    .select("global_role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError || callerProfile?.global_role !== "admin") return response(request, { error: "No tienes permiso para invitar presidentes." }, 403);

  let payload: InvitePayload;
  try {
    payload = await request.json();
  } catch {
    return response(request, { error: "La solicitud no tiene un formato válido." }, 400);
  }

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const displayName = typeof payload?.displayName === "string" ? payload.displayName.trim() : "";
  const clubSlug = typeof payload?.clubSlug === "string" ? payload.clubSlug.trim() : "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !displayName || displayName.length > 80 || !clubSlug) {
    return response(request, { error: "Revisa el nombre, correo y club del presidente." }, 400);
  }

  const { data: club, error: clubError } = await serviceClient
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .maybeSingle();
  if (clubError || !club) return response(request, { error: "No se ha encontrado el club seleccionado." }, 404);

  const { data: invitation, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
    redirectTo: `${appUrl}/?setup=invite#/`,
  });
  if (inviteError || !invitation.user) return response(request, { error: inviteError?.message ?? "No se ha podido enviar la invitación." }, 400);

  const invitedUserId = invitation.user.id;
  const { error: profileUpsertError } = await serviceClient
    .from("profiles")
    .upsert({ id: invitedUserId, display_name: displayName }, { onConflict: "id" });
  if (profileUpsertError) return response(request, { error: "La invitación se creó, pero no se pudo preparar el perfil." }, 500);

  const { error: membershipError } = await serviceClient
    .from("club_memberships")
    .upsert({ club_id: club.id, user_id: invitedUserId, role: "president", is_active: true }, { onConflict: "club_id,user_id" });
  if (membershipError) return response(request, { error: "La invitación se creó, pero no se pudo asignar el club." }, 500);

  await serviceClient.from("audit_logs").insert({
    actor_id: userData.user.id,
    action: "president_invited",
    entity_type: "club",
    entity_id: club.id,
    after_data: { email, display_name: displayName, role: "president" },
  });

  return response(request, { ok: true, club: club.name, email });
});
