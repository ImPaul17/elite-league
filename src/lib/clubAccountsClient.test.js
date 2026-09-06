import assert from "node:assert/strict";
import test from "node:test";
import { describeClubAccountError, invokeClubAccountOperation, listClubAccounts } from "./clubAccountsClient.js";

function listHarness({ isAdmin = true, permissionError = null, queryError = null, rows = [] } = {}) {
  const calls = [];
  const client = {
    async rpc(name) { calls.push(["rpc", name]); return { data: isAdmin, error: permissionError }; },
    from(table) {
      calls.push(["from", table]);
      const query = {
        select(fields) { calls.push(["select", fields]); return query; },
        eq(field, value) { calls.push(["eq", field, value]); return query; },
        then(resolve, reject) { return Promise.resolve({ data: rows, error: queryError }).then(resolve, reject); },
      };
      return query;
    },
    functions: { invoke() { throw new Error("Read-only account listing must not invoke an Edge Function"); } },
  };
  return { client, calls };
}

const profile = { id: "coca-user", display_name: "Álvaro", username: "alvaro.coca", must_change_password: true, global_role: "member" };
const club = { slug: "ca-coca-jrs", name: "CA Coca Jrs" };

test("la lista de presidentes verifica is_admin en el servidor antes de leer con RLS y conserva el contrato", async () => {
  const { client, calls } = listHarness({ rows: [{ user_id: "coca-user", profiles: profile, clubs: club }] });
  assert.deepEqual(await listClubAccounts(client), { ok: true, accounts: [{
    userId: "coca-user", name: "Álvaro", username: "alvaro.coca", requiresPasswordChange: true,
    isAdmin: false, clubId: "ca-coca-jrs", clubName: "CA Coca Jrs",
  }] });
  assert.deepEqual(calls[0], ["rpc", "is_admin"]);
  assert.deepEqual(calls[1], ["from", "club_memberships"]);
  assert.match(calls[2][1], /profiles!inner\(id, display_name, username, must_change_password, global_role\)/);
  assert.match(calls[2][1], /clubs!inner\(slug, name\)/);
  assert.deepEqual(calls.slice(3), [["eq", "role", "president"], ["eq", "is_active", true]]);
});

test("anonimos, presidentes y administradores con temporal no consultan membresias si is_admin los rechaza", async () => {
  for (const identity of ["anonymous", "president", "temporary-admin"]) {
    const { client, calls } = listHarness({ isAdmin: false });
    const result = await listClubAccounts(client);
    assert.equal(result.ok, false, identity);
    assert.match(result.error, /administración|administrador/);
    assert.deepEqual(calls, [["rpc", "is_admin"]]);
  }
  for (const isAdmin of [null, undefined, "true", 1, {}, []]) {
    const { client, calls } = listHarness({ isAdmin: null });
    client.rpc = async () => { calls.push(["rpc", "is_admin"]); return { data: isAdmin }; };
    assert.equal((await listClubAccounts(client)).ok, false);
    assert.deepEqual(calls, [["rpc", "is_admin"]]);
  }
});

test("un error verificando permisos cierra el acceso sin consultar ni revelar detalles tecnicos", async () => {
  const { client, calls } = listHarness({ permissionError: { message: "private database detail" } });
  const result = await listClubAccounts(client);
  assert.equal(result.ok, false);
  assert.equal(result.error.includes("private database detail"), false);
  assert.deepEqual(calls, [["rpc", "is_admin"]]);
});

test("lista vacia y relaciones Supabase como arrays mantienen el contrato sin modificar cuentas", async () => {
  assert.deepEqual(await listClubAccounts(listHarness().client), { ok: true, accounts: [] });
  const rows = [{ user_id: "admin", profiles: [{ ...profile, global_role: "admin" }], clubs: [club] }];
  const before = structuredClone(rows);
  const result = await listClubAccounts(listHarness({ rows }).client);
  assert.equal(result.accounts[0].isAdmin, true);
  assert.equal(result.accounts[0].requiresPasswordChange, true);
  assert.deepEqual(rows, before);
});

test("un fallo de lectura o respuesta incompleta no presenta una lista como correcta", async () => {
  for (const state of [{ queryError: { message: "secret" } }, { rows: null }, { rows: [{ profiles: null, clubs: club }] }]) {
    const result = await listClubAccounts(listHarness(state).client);
    assert.equal(result.ok, false);
    assert.equal(result.error.includes("secret"), false);
    assert.equal("accounts" in result, false);
  }
  assert.equal((await listClubAccounts({ rpc: async () => { throw new Error("network"); } })).ok, false);
});

function httpError(status, body) {
  return { name: "FunctionsHttpError", context: new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }) };
}

test("los errores de la funcion conservan mensajes seguros y avisos de operacion parcial", async () => {
  const result = await describeClubAccountError(httpError(500, { error: "La cuenta ya existe, falta asignar el club.", partial: true }));
  assert.deepEqual(result, { ok: false, error: "La cuenta ya existe, falta asignar el club.", partial: true });
});

test("los errores del gateway distinguen sesion, permisos, despliegue, limite y disponibilidad sin exponerlos crudos", async () => {
  for (const [status, expected] of [[401, /sesión/], [403, /rechazado/], [404, /no está disponible/], [429, /demasiadas/], [503, /temporalmente/]]) {
    const result = await describeClubAccountError(httpError(status, { message: "raw gateway diagnostic", code: "opaque" }));
    assert.equal(result.ok, false);
    assert.match(result.error, expected);
    assert.equal(result.error.includes("raw gateway diagnostic"), false);
  }
  assert.match((await describeClubAccountError({ name: "FunctionsFetchError", context: new Error("fetch failed") })).error, /conectar/);
  assert.match((await describeClubAccountError({ name: "FunctionsRelayError" })).error, /temporalmente/);
  assert.match((await describeClubAccountError({ context: new Response("<html>unavailable</html>", { status: 503 }) })).error, /temporalmente/);
  assert.equal((await describeClubAccountError(null)).ok, false);
});

test("las escrituras siguen usando Edge sin reintentos ni modificar la sesion aunque la respuesta se pierda", async () => {
  for (const action of ["create", "reset", "change-password"]) {
    const calls = [];
    const client = { functions: { async invoke(...args) { calls.push(args); return { error: { name: "FunctionsFetchError" } }; } } };
    const result = await invokeClubAccountOperation(client, action, { userId: "test-user", action: "spoofed" });
    assert.equal(result.ok, false);
    assert.deepEqual(calls, [["club-accounts", { body: { userId: "test-user", action } }]]);
  }
});

test("escrituras conservan confirmacion y advertencias, y no inventan exito con respuestas vacias", async () => {
  const confirmed = { ok: true, warning: "La contraseña cambió, pero falta auditarla." };
  assert.deepEqual(await invokeClubAccountOperation({ functions: { invoke: async () => ({ data: confirmed }) } }, "reset"), confirmed);
  for (const data of [null, {}, { error: 15 }]) assert.equal((await invokeClubAccountOperation({ functions: { invoke: async () => ({ data }) } }, "reset")).ok, false);
  const result = await invokeClubAccountOperation({ functions: { invoke: async () => { throw new Error("private details"); } } }, "reset");
  assert.equal(result.ok, false);
  assert.equal(result.error.includes("private details"), false);
});
