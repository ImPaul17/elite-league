import test from "node:test";
import assert from "node:assert/strict";
import { createAccountHandler } from "../../supabase/functions/club-accounts/handler.js";

const origin = "https://eliteleague.qd.je";
const password = "permanent-for-tests-only";
const temporaryPassword = "012345!";
function harness({ role = "admin", temporary = false, signedIn = true, verified = true, targetAdmin = false, auditError = false } = {}) {
  const calls = [];
  const own = { id: "caller", global_role: role, username: "pablo/pico", must_change_password: temporary };
  function from(table) {
    const query = { table, action: "select", where: {} };
    const chain = {
      select() { return chain; }, update(value) { query.action = "update"; query.value = value; return chain; },
      insert(value) { query.action = "insert"; query.value = value; return chain; },
      eq(key, value) { query.where[key] = value; return chain; }, limit() { return chain; },
      single() { return execute(); }, maybeSingle() { return execute(); },
      then(resolve, reject) { return execute().then(resolve, reject); },
    };
    async function execute() {
      calls.push({ ...query });
      if (table === "audit_logs" && auditError) return { error: new Error("unavailable") };
      if (query.action !== "select") return { data: { id: query.where.id || "created" }, error: null };
      if (table === "profiles") return { data: query.where.id === "caller" ? own : { id: "target", username: "alvaros/coca", global_role: targetAdmin ? "admin" : "member" } };
      if (table === "clubs") return { data: { id: "club", name: "Pico FC" } };
      if (table === "club_memberships") return { data: [{ id: "member" }] };
      return { data: [] };
    }
    return chain;
  }
  const getEnv = (key) => ({ ALLOWED_ORIGINS: origin, SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon-test", SUPABASE_SERVICE_ROLE_KEY: "server-test" })[key];
  const createClient = (_url, key) => ({ from, auth: {
    getUser: async () => ({ data: { user: signedIn ? { id: "caller", email: "pablo--pico@accounts.eliteleague.qd.je" } : null } }),
    signInWithPassword: async () => ({ data: { user: verified ? { id: "caller" } : null }, error: verified ? null : new Error("invalid") }),
    signOut: async () => ({ error: null }),
    admin: {
      async createUser(value) { assert.equal(key, "server-test"); calls.push({ action: "createUser", value }); return { data: { user: { id: "created" } } }; },
      async updateUserById(id, value) { assert.equal(key, "server-test"); calls.push({ action: "updateUser", id, value }); return { data: {} }; },
    },
  } });
  const handler = createAccountHandler({ createClient, getEnv });
  return { calls, async request(body, { auth = true, site = origin } = {}) {
    const response = await handler(new Request("https://example.supabase.co/functions/v1/club-accounts", { method: "POST", headers: { "Content-Type": "application/json", origin: site, ...(auth ? { Authorization: "Bearer test" } : {}) }, body: JSON.stringify(body) }));
    return { status: response.status, data: await response.json() };
  } };
}

test("cuentas: rechaza peticiones anónimas, identidades inválidas y otros orígenes", async () => {
  assert.equal((await harness().request({ action: "create" }, { auth: false })).status, 401);
  assert.equal((await harness({ signedIn: false }).request({ action: "list" })).status, 401);
  assert.equal((await harness().request({ action: "list" }, { site: "https://evil.example" })).status, 403);
});
test("cuentas: un presidente o admin temporal no crea, lista ni restablece cuentas", async () => {
  for (const state of [{ role: "member" }, { temporary: true }]) for (const action of ["create", "list", "reset"]) {
    const app = harness(state);
    assert.equal((await app.request({ action, password: temporaryPassword })).status, 403);
    assert.equal(app.calls.some((call) => ["insert", "update", "createUser", "updateUser"].includes(call.action)), false);
  }
});
test("cuentas: cambio propio verifica contraseña actual y no acepta otro userId", async () => {
  const invalid = harness({ role: "member", verified: false });
  assert.equal((await invalid.request({ action: "change-password", currentPassword: "wrong", password })).status, 400);
  assert.equal(invalid.calls.some((call) => call.action === "updateUser"), false);
  const app = harness({ role: "member", temporary: true });
  assert.equal((await app.request({ action: "change-password", userId: "another-person", currentPassword: "old", password })).data.ok, true);
  assert.equal(app.calls.find((call) => call.action === "updateUser").id, "caller");
  assert.equal(app.calls.find((call) => call.table === "profiles" && call.action === "update").value.must_change_password, false);
});
test("cuentas: restablecer bloquea primero y excluye al propio admin u otros admins", async () => {
  assert.equal((await harness().request({ action: "reset", userId: "caller", password: temporaryPassword })).status, 400);
  assert.equal((await harness({ targetAdmin: true }).request({ action: "reset", userId: "target", password: temporaryPassword })).status, 400);
  const app = harness();
  assert.equal((await app.request({ action: "reset", userId: "target", password: temporaryPassword })).data.ok, true);
  assert.equal(app.calls.find((call) => call.action === "updateUser").value.password, temporaryPassword);
  assert.ok(app.calls.findIndex((call) => call.table === "profiles" && call.action === "update") < app.calls.findIndex((call) => call.action === "updateUser"));
});
test("cuentas: crear confirma el identificador interno y no devuelve ni audita contraseñas", async () => {
  const app = harness();
  const result = await app.request({ action: "create", username: " Pablo/Pico ", displayName: "Pablo", clubSlug: "pico-fc", password: temporaryPassword });
  assert.equal(result.data.ok, true);
  assert.equal(result.data.username, "pablo/pico");
  const creation = app.calls.find((call) => call.action === "createUser");
  assert.equal(creation.value.email, "pablo--pico@accounts.eliteleague.qd.je");
  assert.equal(creation.value.password, temporaryPassword);
  assert.equal(creation.value.email_confirm, true);
  assert.equal(JSON.stringify(result).includes(temporaryPassword), false);
  assert.equal(JSON.stringify(app.calls.filter((call) => call.table === "audit_logs")).includes(temporaryPassword), false);
  assert.equal(app.calls.find((call) => call.table === "profiles" && call.action === "update").value.must_change_password, true);
});

test("cuentas: un fallo de auditoría no oculta que la contraseña ya se cambió", async () => {
  const result = await harness({ auditError: true }).request({ action: "change-password", currentPassword: "old", password });
  assert.equal(result.data.ok, true);
  assert.match(result.data.warning, /no repitas/i);
});

test("cuentas: create y reset exigen la temporal de seis dígitos y un carácter antes de escribir", async () => {
  for (const action of ["create", "reset"]) for (const invalid of [password, "12345!", "1234567", "123456!a", "!123456", "123456 ", "123456!\n", "123456ñ", "123456/", null]) {
    const app = harness();
    const result = await app.request({ action, username: "pablo/pico", displayName: "Pablo", clubSlug: "pico-fc", userId: "target", password: invalid });
    assert.equal(result.status, 400, `${action}: ${String(invalid)}`);
    assert.equal(app.calls.some((call) => ["insert", "update", "createUser", "updateUser"].includes(call.action)), false);
  }
});

test("cuentas: create y reset aceptan temporales con letra o símbolo conservando ceros iniciales", async () => {
  for (const action of ["create", "reset"]) for (const valid of ["012345a", "012345Z", "000000?", "123456@", "123456#", "123456$", "123456%", "123456&"]) {
    const app = harness();
    assert.equal((await app.request({ action, username: "pablo/pico", displayName: "Pablo", clubSlug: "pico-fc", userId: "target", password: valid })).data.ok, true);
    assert.equal(app.calls.find((call) => call.action === (action === "create" ? "createUser" : "updateUser")).value.password, valid);
  }
});

test("cuentas: no crea usuarios con formatos anteriores, espacios internos ni partes demasiado largas", async () => {
  for (const username of ["pablo", "pablo.pico", "pablo--pico", "pablo /pico", "pablo/pico/otro", "pablo-fc/pico", "pablo/pi_co", `${"p".repeat(25)}/pico`, `pablo/${"c".repeat(21)}`]) {
    const app = harness();
    assert.equal((await app.request({ action: "create", username, displayName: "Pablo", clubSlug: "pico-fc", password: temporaryPassword })).status, 400);
    assert.equal(app.calls.some((call) => call.action === "createUser"), false);
  }
});

test("cuentas: la temporal permite reautenticar pero no sustituye a la definitiva de mínimo 12 caracteres", async () => {
  const rejected = harness({ role: "member", temporary: true });
  assert.equal((await rejected.request({ action: "change-password", currentPassword: temporaryPassword, password: "654321?" })).status, 400);
  assert.equal(rejected.calls.some((call) => call.action === "updateUser"), false);
  const app = harness({ role: "member", temporary: true });
  assert.equal((await app.request({ action: "change-password", currentPassword: temporaryPassword, password })).data.ok, true);
  assert.equal(app.calls.find((call) => call.action === "updateUser").value.password, password);
  assert.equal(app.calls.find((call) => call.table === "profiles" && call.action === "update").value.must_change_password, false);
});
