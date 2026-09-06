import { supabase } from "./supabase";

export async function manageClubAccount(action, input = {}) {
  if (!supabase) return { ok: false, error: "La gestión de cuentas reales no está disponible en la demostración." };
  try {
    const { data, error } = await supabase.functions.invoke("club-accounts", { body: { ...input, action } });
    if (error) {
      let detail;
      try { detail = await error.context?.json(); } catch { /* An unavailable endpoint may not return JSON. */ }
      return { ok: false, error: detail?.error || "No se ha podido completar la operación. Comprueba la conexión y que el servicio de cuentas esté desplegado.", partial: Boolean(detail?.partial) };
    }
    return data?.ok ? data : { ok: false, error: data?.error || "El servidor no ha confirmado la operación." };
  } catch {
    return { ok: false, error: "No se ha podido conectar con el servicio de cuentas." };
  }
}
