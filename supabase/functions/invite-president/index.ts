import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

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
    .select("global_role, must_change_password")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError || callerProfile?.global_role !== "admin" || callerProfile.must_change_password) return response(request, { error: "No tienes permiso para invitar presidentes." }, 403);
  // Username accounts replace email invitations. Keep old clients fail-closed.
  return response(request, { error: "Las invitaciones por correo están desactivadas. Usa Usuarios de los clubes." }, 410);

});
