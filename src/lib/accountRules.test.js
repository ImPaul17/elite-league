import test from "node:test";
import assert from "node:assert/strict";
import { accountIdentifier, normalizeUsername, validUsername, passwordError } from "../../supabase/functions/_shared/accountRules.js";

test("normaliza usuarios sin aceptar correos ni caracteres ambiguos", () => {
  assert.equal(normalizeUsername("  Pico.FC "), "pico.fc");
  assert.equal(accountIdentifier("Pico.FC"), "pico.fc@accounts.eliteleague.qd.je");
  for (const value of ["ab", "_pico", "pá b", "pico@otro.com", "pico/../../", "a".repeat(33)]) assert.equal(validUsername(value), false);
  assert.throws(() => accountIdentifier("pico@otro.com"));
});

test("contraseñas temporales y personales comparten los límites", () => {
  assert.ok(passwordError("corta"));
  assert.ok(passwordError(" ".repeat(12)));
  assert.ok(passwordError("a".repeat(129)));
  assert.equal(passwordError("Frase privada de prueba 2026!"), "");
});
