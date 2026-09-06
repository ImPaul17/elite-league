import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createSessionSynchronizer } from "./sessionSynchronizer.js";

const session = (id) => ({ user: { id } });

function createHarness(overrides = {}) {
  const observed = { loads: [], identities: 0, recoveries: 0, errors: [] };
  const synchronizer = createSessionSynchronizer({
    synchronize: async (value) => { observed.loads.push(value?.user?.id ?? null); },
    onIdentityChange: () => { observed.identities += 1; },
    onRecovery: () => { observed.recoveries += 1; },
    onError: (error) => { observed.errors.push(error.message); },
    ...overrides,
  });
  return { observed, synchronizer };
}

test("el callback de auth termina antes de consultar datos y comparte cargas repetidas", async () => {
  const { observed, synchronizer } = createHarness();
  const callback = (event, value) => { synchronizer.sync(event, value); };
  assert.equal(callback("INITIAL_SESSION", session("a")), undefined);
  assert.deepEqual(observed.loads, []);
  const login = synchronizer.sync("SIGNED_IN", session("a"));
  assert.equal(synchronizer.sync("TOKEN_REFRESHED", session("a")), login);
  assert.deepEqual(await login, { ok: true });
  await synchronizer.sync("SIGNED_IN", session("a"));
  assert.deepEqual(observed.loads, ["a"]);
  synchronizer.dispose();
});

test("salir limpia inmediatamente el estado privado e invalida un perfil pendiente", async () => {
  let resolveProfile;
  let privateViewer = "a";
  const pendingProfile = new Promise((resolve) => { resolveProfile = resolve; });
  const { synchronizer } = createHarness({
    onIdentityChange: () => { privateViewer = null; },
    synchronize: async (value, isCurrent) => {
      if (!value) return;
      await pendingProfile;
      if (isCurrent()) privateViewer = value.user.id;
    },
  });
  const login = synchronizer.sync("SIGNED_IN", session("a"));
  await delay(5);
  const logout = synchronizer.sync("SIGNED_OUT", null);
  assert.equal(privateViewer, null);
  assert.equal((await login).ok, false);
  resolveProfile();
  await logout;
  assert.equal(privateViewer, null);
  synchronizer.dispose();
});

test("un cambio rápido de cuenta cancela la carga anterior antes de empezar", async () => {
  const { observed, synchronizer } = createHarness();
  const first = synchronizer.sync("SIGNED_IN", session("a"));
  const second = synchronizer.sync("SIGNED_IN", session("b"));
  assert.equal((await first).ok, false);
  assert.equal((await second).ok, true);
  assert.deepEqual(observed.loads, ["b"]);
  assert.equal(observed.identities, 2);
  synchronizer.dispose();
});

test("el desmontaje cancela tareas diferidas sin consultas ni cambios posteriores", async () => {
  const { observed, synchronizer } = createHarness();
  const pending = synchronizer.sync("INITIAL_SESSION", session("a"));
  synchronizer.dispose();
  assert.equal((await pending).ok, false);
  await delay(5);
  assert.deepEqual(observed.loads, []);
});

test("un error de perfil se comunica y permite reintentar para el mismo usuario", async () => {
  let attempts = 0;
  const { observed, synchronizer } = createHarness({
    synchronize: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("Perfil no disponible");
    },
  });
  assert.deepEqual(await synchronizer.sync("SIGNED_IN", session("a")), { ok: false, error: "Perfil no disponible" });
  assert.deepEqual(observed.errors, ["Perfil no disponible"]);
  assert.deepEqual(await synchronizer.sync("SIGNED_IN", session("a")), { ok: true });
  assert.equal(attempts, 2);
  synchronizer.dispose();
});

test("recovery se procesa incluso si el perfil ya está cargado sin duplicar consultas", async () => {
  const { observed, synchronizer } = createHarness();
  await synchronizer.sync("INITIAL_SESSION", session("a"));
  await synchronizer.sync("PASSWORD_RECOVERY", session("a"));
  assert.equal(observed.recoveries, 1);
  assert.deepEqual(observed.loads, ["a"]);
  await synchronizer.sync("USER_UPDATED", session("a"));
  assert.deepEqual(observed.loads, ["a", "a"]);
  synchronizer.dispose();
});

test("los errores de una cuenta anterior no sobrescriben la sesión actual", async () => {
  let rejectProfile;
  const pendingProfile = new Promise((resolve, reject) => { rejectProfile = reject; });
  const { observed, synchronizer } = createHarness({
    synchronize: async (value) => {
      if (value?.user.id === "a") await pendingProfile;
    },
  });
  const first = synchronizer.sync("SIGNED_IN", session("a"));
  await delay(5);
  const second = synchronizer.sync("SIGNED_IN", session("b"));
  rejectProfile(new Error("Error de la cuenta anterior"));
  await Promise.all([first, second]);
  assert.deepEqual(observed.errors, []);
  synchronizer.dispose();
});
