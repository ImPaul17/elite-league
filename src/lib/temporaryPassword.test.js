import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { generateTemporaryPassword } from "./temporaryPassword.js";
import { TEMPORARY_PASSWORD_CHARACTERS, temporaryPasswordError } from "../../supabase/functions/_shared/accountRules.js";

test("genera temporales de seis dígitos y un carácter usando Web Crypto", () => {
  for (let index = 0; index < 100; index += 1) {
    const password = generateTemporaryPassword(webcrypto);
    assert.equal(password.length, 7);
    assert.equal(temporaryPasswordError(password), "");
  }
});

test("rechaza bytes fuera del rango uniforme y permite ceros iniciales", () => {
  const bytes = [255, 250, 0, 1, 2, 3, 4, 5, 255, TEMPORARY_PASSWORD_CHARACTERS.length - 1];
  const source = { getRandomValues(array) { assert.ok(bytes.length); array[0] = bytes.shift(); return array; } };
  assert.equal(generateTemporaryPassword(source), `012345${TEMPORARY_PASSWORD_CHARACTERS.at(-1)}`);
  assert.equal(bytes.length, 0);
});

test("no recurre a Math.random cuando falta la fuente criptográfica", () => {
  assert.throws(() => generateTemporaryPassword(null), /temporal segura/);
  assert.throws(() => generateTemporaryPassword({}), /temporal segura/);
});
