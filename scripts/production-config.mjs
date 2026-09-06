export function assertProductionConfiguration(env) {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length) {
    throw new Error(`Build de producción bloqueado: configura ${missing.join(" y ")} para conectar el sitio oficial con Supabase.`);
  }
}
