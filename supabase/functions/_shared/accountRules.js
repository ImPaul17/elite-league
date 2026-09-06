export const ACCOUNT_DOMAIN = "accounts.eliteleague.qd.je";

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validUsername(value) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value);
}

// Supabase Auth uses an internal identifier. This is not a contact address and
// no messages are sent to it: accounts are provisioned only by administration.
export function accountIdentifier(value) {
  const username = normalizeUsername(value);
  if (!validUsername(username)) throw new Error("El usuario debe tener entre 3 y 32 caracteres: letras sin tildes, números, punto, guion o guion bajo.");
  return `${username}@${ACCOUNT_DOMAIN}`;
}

export function passwordError(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) return "Usa una contraseña de entre 12 y 128 caracteres.";
  if (!/\S/.test(value)) return "La contraseña no puede estar formada solo por espacios.";
  return "";
}
