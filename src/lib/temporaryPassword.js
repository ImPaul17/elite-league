import { TEMPORARY_PASSWORD_CHARACTERS } from "../../supabase/functions/_shared/accountRules.js";

export function generateTemporaryPassword(secureCrypto = globalThis.crypto) {
  if (!secureCrypto?.getRandomValues) throw new Error("No se puede generar una temporal segura. Abre la web mediante HTTPS e inténtalo de nuevo.");
  function randomIndex(length) {
    const limit = Math.floor(256 / length) * length;
    const value = new Uint8Array(1);
    // Reject the incomplete range instead of biasing results with modulo alone.
    do { secureCrypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % length;
  }
  const digits = Array.from({ length: 6 }, () => String(randomIndex(10))).join("");
  return digits + TEMPORARY_PASSWORD_CHARACTERS[randomIndex(TEMPORARY_PASSWORD_CHARACTERS.length)];
}
