import { supabase } from "./supabase";
import { PREVIEW_READ_ONLY_MESSAGE, previewWriteGuard } from "./userPreview";
import { invokeClubAccountOperation, listClubAccounts } from "./clubAccountsClient.js";

export async function manageClubAccount(action, input = {}) {
  if (action !== "list" && previewWriteGuard.isLocked()) return { ok: false, error: PREVIEW_READ_ONLY_MESSAGE };
  if (!supabase) return { ok: false, error: "La gestión de cuentas reales no está disponible en la demostración." };
  if (action === "list") return listClubAccounts(supabase);
  return invokeClubAccountOperation(supabase, action, input);
}
