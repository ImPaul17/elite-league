export const ACCOUNT_DOMAIN = "accounts.eliteleague.qd.je";
export const TEMPORARY_PASSWORD_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&?";

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validUsername(value) {
  return typeof value === "string" && value === value.trim() && /^[a-z0-9]{1,24}\/[a-z0-9]{1,20}$/.test(value);
}

// Supabase Auth uses an internal identifier. This is not a contact address and
// no messages are sent to it: accounts are provisioned only by administration.
export function accountIdentifier(value) {
  const username = normalizeUsername(value);
  if (!validUsername(username)) throw new Error("Usa presidente/clubabreviado, en minúsculas y sin espacios: hasta 24 letras o números para presidente y 20 para club.");
  // Neither part permits hyphens, so replacing the only slash with -- is injective.
  return `${username.replace("/", "--")}@${ACCOUNT_DOMAIN}`;
}

export function temporaryPasswordError(value) {
  if (typeof value !== "string" || value.length !== 7 || !/^[0-9]{6}[A-Za-z!@#$%&?]$/.test(value)) {
    return "La contraseña temporal debe tener seis dígitos seguidos de una letra o uno de estos símbolos: ! @ # $ % & ?.";
  }
  return "";
}

export function passwordError(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) return "Usa una contraseña de entre 12 y 128 caracteres.";
  if (!/\S/.test(value)) return "La contraseña no puede estar formada solo por espacios.";
  return "";
}
