import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionConfiguration } from "./production-config.mjs";

test("la build exige URL y clave pública incluso si solo falta una", () => {
  for (const env of [{}, { VITE_SUPABASE_URL: "https://example.supabase.co" }, { VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key" }]) {
    assert.throws(() => assertProductionConfiguration(env), /Build de producción bloqueado/);
  }
});

test("las variables vacías o con espacios no habilitan una build oficial", () => {
  assert.throws(() => assertProductionConfiguration({ VITE_SUPABASE_URL: "   ", VITE_SUPABASE_PUBLISHABLE_KEY: "" }), /VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY/);
});

test("una configuración pública completa permite la build", () => {
  assert.doesNotThrow(() => assertProductionConfiguration({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key" }));
});
