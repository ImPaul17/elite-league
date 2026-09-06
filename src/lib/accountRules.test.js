import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCOUNT_DOMAIN, TEMPORARY_PASSWORD_CHARACTERS, accountIdentifier, normalizeUsername, validUsername, passwordError, temporaryPasswordError } from "../../supabase/functions/_shared/accountRules.js";

test("normaliza el usuario presidente.club sin quitar espacios internos ni inventar separadores", () => {
  assert.equal(normalizeUsername("  Pablo.Pico "), "pablo.pico");
  assert.equal(normalizeUsername("Pablo . Pico"), "pablo . pico");
  assert.equal(normalizeUsername("Pablo/Pico"), "pablo/pico");
  assert.equal(normalizeUsername(null), "");
  assert.equal(accountIdentifier("  Pablo.Pico "), `pablo--pico@${ACCOUNT_DOMAIN}`);
  assert.equal(accountIdentifier("alvaro.coca"), `alvaro--coca@${ACCOUNT_DOMAIN}`);
  assert.equal(accountIdentifier("alvaro.rayo"), `alvaro--rayo@${ACCOUNT_DOMAIN}`);
  assert.equal(accountIdentifier("dani.mugiwaras"), `dani--mugiwaras@${ACCOUNT_DOMAIN}`);
  assert.equal(accountIdentifier("dani.caudillo"), `dani--caudillo@${ACCOUNT_DOMAIN}`);
});

test("usuario: exactamente dos partes alfanuméricas minúsculas de hasta 24 y 20 caracteres", () => {
  for (const value of ["a.b", "pablo.pico", "presidente24.club2026", `${"p".repeat(24)}.${"c".repeat(20)}`]) assert.equal(validUsername(value), true, value);
  for (const value of ["", "pablo", ".pico", "pablo.", "pablo.pico.otro", "pablo..pico", "pablo/pico", "pablo//pico", "pablo pico", "pablo .pico", "pablo. pico", "pá blo.pico", "pá.pico", "pablo.picó", "Pablo.pico", "pablo.Pico", " pablo.pico", "pablo.pico ", "pablo.pico\n", "pablo.fc.pico", "pablo-fc.pico", "pablo_fc.pico", "pablo.pi.co", "pablo.pi-co", "pablo.pi_co", "pablo@pico", "pablo/../../", "pablo\\pico", `${"p".repeat(25)}.pico`, `pablo.${"c".repeat(21)}`, null, undefined, 12, {}, []]) assert.equal(validUsername(value), false, String(value));
});

test("el identificador de Auth conserva ambas partes sin colisiones y cabe en un correo válido", () => {
  const usernames = ["a.bc", "ab.c", "pablo.pico", "pablopico.club", "pablo.picoclub", "alvaro.coca", "alvaro.rayo", "dani.mugiwaras", "dani.caudillo", `${"p".repeat(24)}.${"c".repeat(20)}`];
  const identifiers = usernames.map(accountIdentifier);
  assert.equal(new Set(identifiers).size, usernames.length);
  for (const identifier of identifiers) {
    const [local, domain] = identifier.split("@");
    assert.equal(domain, ACCOUNT_DOMAIN);
    assert.ok(local.length <= 64);
    assert.match(local, /^[a-z0-9]+--[a-z0-9]+$/);
  }
  for (const value of ["pablo--pico", "pablo--.pico", "pablo.pico--", "pablo.pico.otro", "pablo..pico", "pablo/pico", "pablo@otro.com"]) assert.throws(() => accountIdentifier(value));
});

test("la restricción SQL utiliza el mismo formato canónico presidente.club", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/0003_username_accounts_and_news_audit.sql", import.meta.url), "utf8");
  assert.ok(sql.includes("username ~ '^[a-z0-9]{1,24}\\.[a-z0-9]{1,20}$'"));
});

test("temporales: seis dígitos seguidos de una letra ASCII o símbolo permitido", () => {
  assert.equal(new Set(TEMPORARY_PASSWORD_CHARACTERS).size, TEMPORARY_PASSWORD_CHARACTERS.length);
  for (const suffix of TEMPORARY_PASSWORD_CHARACTERS) {
    assert.equal(temporaryPasswordError(`012345${suffix}`), "");
    assert.equal(temporaryPasswordError(`999999${suffix}`), "");
  }
  assert.equal(temporaryPasswordError("000000?"), "");
});

test("temporales: rechaza longitudes distintas, dígito final, espacios y caracteres ambiguos", () => {
  for (const value of ["", "12345!", "1234567", "12345678", "123456!a", "!123456", "12345a!", "123456 ", "123456\n", "123456!\n", " 123456!", "123456! ", "123456ñ", "123456🙂", "123456/", "123456\\", "123456-", "123456_", "123456.", "123456\"", "１２３４５６!", "una frase larga definitiva", 1234567, null, undefined, [], {}]) assert.ok(temporaryPasswordError(value), String(value));
});

test("la contraseña definitiva sigue exigiendo 12 a 128 caracteres, independiente de la temporal", () => {
  for (const value of ["123456!", "a".repeat(11), " ".repeat(12), "a".repeat(129), null, undefined, 123456789012]) assert.ok(passwordError(value));
  assert.equal(passwordError("a".repeat(12)), "");
  assert.equal(passwordError("a".repeat(128)), "");
  assert.equal(passwordError("Frase privada de prueba 2026!"), "");
});
