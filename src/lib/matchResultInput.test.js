import test from "node:test";
import assert from "node:assert/strict";
import { validateMatchResultInput } from "./matchResultInput.js";

const regular = { homeScore: "1", awayScore: "2", homePenalties: "", awayPenalties: "" };
const draw = { homeScore: "0", awayScore: "0", homePenalties: "2", awayPenalties: "1" };

test("no publica resultados a partir de marcadores vacíos", () => {
  for (const blank of ["", "   ", "\t", null, undefined]) {
    assert.equal(validateMatchResultInput({ ...regular, homeScore: blank }).ok, false);
    assert.equal(validateMatchResultInput({ ...regular, awayScore: blank }).ok, false);
    assert.equal(validateMatchResultInput({ ...draw, homeScore: blank, awayScore: blank }).ok, false);
  }
});

test("el cero debe ser explícito y los resultados válidos conservan sus valores", () => {
  assert.deepEqual(validateMatchResultInput({ ...regular, homeScore: "0" }), { ok: true, homeScore: 0, awayScore: 2, homePenalties: null, awayPenalties: null });
  assert.deepEqual(validateMatchResultInput({ homeScore: 3, awayScore: 1 }), { ok: true, homeScore: 3, awayScore: 1, homePenalties: null, awayPenalties: null });
  assert.deepEqual(validateMatchResultInput(draw), { ok: true, homeScore: 0, awayScore: 0, homePenalties: 2, awayPenalties: 1 });
});

test("rechaza marcadores negativos, decimales, coerciones y valores fuera del esquema", () => {
  for (const invalid of [-1, 1.5, NaN, Infinity, 32768, "-1", "1.5", "1e2", "0x10", "+2", "32768", true, [], {}]) {
    assert.equal(validateMatchResultInput({ ...regular, homeScore: invalid }).ok, false, String(invalid));
    assert.equal(validateMatchResultInput({ ...regular, awayScore: invalid }).ok, false, String(invalid));
  }
});

test("un empate requiere dos marcadores de penaltis válidos y distintos", () => {
  for (const invalid of ["", "   ", null, undefined, -1, "-1", "1.5", "1e2", "32768", true]) {
    assert.equal(validateMatchResultInput({ ...draw, homePenalties: invalid }).ok, false, String(invalid));
    assert.equal(validateMatchResultInput({ ...draw, awayPenalties: invalid }).ok, false, String(invalid));
  }
  assert.equal(validateMatchResultInput({ ...draw, homePenalties: "1", awayPenalties: "1" }).ok, false);
  assert.equal(validateMatchResultInput({ ...draw, homePenalties: "0", awayPenalties: "0" }).ok, false);
  assert.equal(validateMatchResultInput({ ...draw, homePenalties: "0", awayPenalties: "1" }).ok, true);
});

test("no admite penaltis sin empate, ni siquiera un cero aislado", () => {
  assert.equal(validateMatchResultInput({ ...regular, homePenalties: "0" }).ok, false);
  assert.equal(validateMatchResultInput({ ...regular, awayPenalties: "0" }).ok, false);
  assert.equal(validateMatchResultInput({ ...regular, homePenalties: "2", awayPenalties: "1" }).ok, false);
  assert.deepEqual(validateMatchResultInput({ ...regular, homePenalties: "   ", awayPenalties: "\t" }), { ok: true, homeScore: 1, awayScore: 2, homePenalties: null, awayPenalties: null });
});

test("normaliza espacios alrededor de números y respeta el límite smallint", () => {
  assert.deepEqual(validateMatchResultInput({ ...regular, homeScore: " 02 ", awayScore: " 0 " }), { ok: true, homeScore: 2, awayScore: 0, homePenalties: null, awayPenalties: null });
  assert.equal(validateMatchResultInput({ ...regular, homeScore: 32767 }).ok, true);
});
