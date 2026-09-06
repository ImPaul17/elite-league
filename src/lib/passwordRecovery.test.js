import assert from "node:assert/strict";
import test from "node:test";
import { createPasswordRecoveryInitializer, createPasswordRecoveryTracker, getPasswordRecoveryCallback } from "./passwordRecovery.js";

const session = (id) => ({ user: { id } });
const recoveryUrl = "https://eliteleague.example/?setup=recovery&code=one-time-code#/";
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), values };
}

test("la URL de recuperación identifica un callback, nunca una prueba de identidad", () => {
  assert.equal(getPasswordRecoveryCallback(null), null);
  assert.equal(getPasswordRecoveryCallback("https://eliteleague.example/?setup=invite#/"), null);
  assert.deepEqual(getPasswordRecoveryCallback("https://eliteleague.example/?setup=recovery#/"), { hasCode: false, hasError: false });
  assert.deepEqual(getPasswordRecoveryCallback(recoveryUrl), { hasCode: true, hasError: false });
  assert.deepEqual(getPasswordRecoveryCallback("https://eliteleague.example/?setup=recovery#error=access_denied"), { hasCode: false, hasError: true });
});

test("una sesión normal con setup=recovery no activa el cambio de contraseña", async () => {
  const tracker = createPasswordRecoveryTracker();
  tracker.handleAuthEvent("INITIAL_SESSION", session("existing-admin"));
  let cleared = 0;
  const initialize = createPasswordRecoveryInitializer(getPasswordRecoveryCallback("https://eliteleague.example/?setup=recovery#/"), {
    tracker, initializeAuth: async () => ({ error: null }), getSession: async () => ({ data: { session: session("existing-admin") }, error: null }), clearUrl: () => { cleared += 1; },
  });
  const first = initialize();
  assert.equal(initialize(), first);
  assert.match((await first).error.message, /no ha verificado/);
  assert.equal(tracker.isVerifiedFor(session("existing-admin")), false);
  assert.equal(cleared, 1);
});

test("un evento PKCE verificado antes de montar React se conserva para la sesión correcta", async () => {
  const tracker = createPasswordRecoveryTracker();
  const initialize = createPasswordRecoveryInitializer(getPasswordRecoveryCallback(recoveryUrl), {
    tracker,
    initializeAuth: async () => { tracker.handleAuthEvent("PASSWORD_RECOVERY", session("recovered-user")); return { error: null }; },
    getSession: async () => ({ data: { session: session("recovered-user") }, error: null }),
    clearUrl: () => assert.fail("No debe limpiar un callback aceptado"),
  });
  assert.deepEqual(await initialize(), { error: null });
  assert.equal(tracker.isVerifiedFor(session("recovered-user")), true);
});

test("recargar continúa sólo una recuperación ya verificada en la misma pestaña y cuenta", async () => {
  const storage = memoryStorage();
  let now = 1000;
  createPasswordRecoveryTracker({ storage, now: () => now }).handleAuthEvent("PASSWORD_RECOVERY", session("recovered-user"));
  const tracker = createPasswordRecoveryTracker({ storage, now: () => now });
  const initialize = createPasswordRecoveryInitializer(getPasswordRecoveryCallback("https://eliteleague.example/?setup=recovery#/"), {
    tracker, initializeAuth: async () => ({ error: null }), getSession: async () => ({ data: { session: session("recovered-user") }, error: null }), clearUrl: () => assert.fail("La recarga legítima debe continuar"),
  });
  assert.deepEqual(await initialize(), { error: null });
  assert.equal([...storage.values.values()].some((value) => value.includes("access_token") || value.includes("refresh_token")), false);
  now += 30 * 60 * 1000;
  assert.equal(tracker.isVerifiedFor(session("recovered-user")), false);
  assert.equal(storage.values.size, 0);
});

test("un enlace nuevo sin verificador PKCE no cambia la contraseña de una cuenta previa", async () => {
  const tracker = createPasswordRecoveryTracker();
  tracker.handleAuthEvent("PASSWORD_RECOVERY", session("previous-admin"));
  let cleared = false;
  const initialize = createPasswordRecoveryInitializer(getPasswordRecoveryCallback(recoveryUrl), {
    tracker,
    // This is how Auth behaves when this browser has no verifier for the link.
    initializeAuth: async () => ({ error: null }),
    getSession: async () => ({ data: { session: session("previous-admin") }, error: null }),
    clearUrl: () => { cleared = true; },
  });
  assert.match((await initialize()).error.message, /navegador donde lo pediste/);
  assert.equal(tracker.isVerifiedFor(session("previous-admin")), false);
  assert.equal(cleared, true);
});

test("enlaces caducados y errores de canje se muestran sin reutilizar sesiones anteriores", async () => {
  for (const callback of [getPasswordRecoveryCallback("https://eliteleague.example/?setup=recovery#error=access_denied"), getPasswordRecoveryCallback(recoveryUrl)]) {
    const tracker = createPasswordRecoveryTracker();
    tracker.handleAuthEvent("PASSWORD_RECOVERY", session("old-user"));
    let cleared = false;
    const initialize = createPasswordRecoveryInitializer(callback, {
      tracker, initializeAuth: async () => ({ error: new Error("Invalid code") }), getSession: () => assert.fail("No se debe aceptar la sesión anterior"), clearUrl: () => { cleared = true; },
    });
    assert.ok((await initialize()).error);
    assert.equal(cleared, true);
    assert.equal(tracker.isVerifiedFor(session("old-user")), false);
  }
});

test("cambiar de cuenta, salir o completar el cambio borra la continuación verificada", () => {
  const tracker = createPasswordRecoveryTracker({ storage: memoryStorage() });
  for (const clear of [() => tracker.handleAuthEvent("SIGNED_IN", session("another-user")), () => tracker.handleAuthEvent("SIGNED_OUT", null), () => tracker.handleAuthEvent("INITIAL_SESSION", null), () => tracker.clear()]) {
    tracker.handleAuthEvent("PASSWORD_RECOVERY", session("original-user"));
    assert.equal(tracker.isVerifiedFor(session("original-user")), true);
    clear();
    assert.equal(tracker.isVerifiedFor(session("original-user")), false);
  }
});

test("sin almacenamiento disponible el evento verificado funciona sólo en memoria", () => {
  const blocked = () => { throw new Error("Storage unavailable"); };
  const tracker = createPasswordRecoveryTracker({ storage: { getItem: blocked, setItem: blocked, removeItem: blocked } });
  tracker.handleAuthEvent("PASSWORD_RECOVERY", session("user"));
  assert.equal(tracker.isVerifiedFor(session("user")), true);
  tracker.clear();
  assert.equal(tracker.isVerifiedFor(session("user")), false);
});
