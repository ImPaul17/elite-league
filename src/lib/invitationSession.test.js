import assert from "node:assert/strict";
import test from "node:test";
import { createInvitationSessionInitializer, getInvitationCallback } from "./invitationSession.js";

const invitationUrl = "https://eliteleague.example/?setup=invite#access_token=test-access&refresh_token=test-refresh&type=invite";

test("solo acepta tokens completos de un enlace de invitación", () => {
  assert.deepEqual(getInvitationCallback(invitationUrl), { tokens: { access_token: "test-access", refresh_token: "test-refresh" } });
  for (const href of [null, "https://eliteleague.example/", "https://eliteleague.example/?setup=invite#/", invitationUrl.replace("setup=invite", "setup=recovery"), invitationUrl.replace("type=invite", "type=recovery"), invitationUrl.replace("refresh_token=test-refresh&", "")]) {
    assert.equal(getInvitationCallback(href), null);
  }
});

test("limpia la URL antes de aceptar y comparte la inicialización en StrictMode", async () => {
  const events = [];
  const initialize = createInvitationSessionInitializer(getInvitationCallback(invitationUrl), {
    clearUrl: () => events.push("clear"),
    setSession: async (tokens) => {
      assert.equal(tokens.refresh_token, "test-refresh");
      events.push("accept");
      return { error: null };
    },
  });
  const first = initialize();
  assert.equal(initialize(), first);
  assert.deepEqual(await first, { error: null });
  assert.deepEqual(events, ["clear", "accept"]);
});

test("un enlace expirado se limpia y comunica su error sin intentar crear sesión", async () => {
  let cleared = false;
  const initialize = createInvitationSessionInitializer(getInvitationCallback("https://eliteleague.example/?setup=invite#error=access_denied&error_description=Enlace+caducado"), {
    clearUrl: () => { cleared = true; },
    setSession: () => { assert.fail("No debe aceptar un enlace caducado"); },
  });
  assert.equal((await initialize()).error.message, "Enlace caducado");
  assert.equal(cleared, true);
});

test("los fallos de red de la invitación se devuelven sin rechazo no controlado", async () => {
  const initialize = createInvitationSessionInitializer(getInvitationCallback(invitationUrl), {
    clearUrl: () => {},
    setSession: async () => { throw new Error("Sin conexión"); },
  });
  assert.equal((await initialize()).error.message, "Sin conexión");
});
