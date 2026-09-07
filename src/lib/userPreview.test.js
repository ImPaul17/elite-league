import assert from "node:assert/strict";
import test from "node:test";
import {
  PREVIEW_BLOCKED_ACTIONS,
  PREVIEW_READ_ONLY_MESSAGE,
  canStartUserPreview,
  createPreviewViewer,
  createPreviewWriteGuard,
  guardPreviewActions,
  projectPreviewLeague,
} from "./userPreview.js";
import { resolveClubPortalAccess } from "./clubWorkspace.js";

const clubs = Object.freeze([
  Object.freeze({ id: "pico-fc" }),
  Object.freeze({ id: "ca-coca-jrs" }),
]);
const administrator = Object.freeze({ id: "real-admin", role: "admin", clubId: "pico-fc", requiresPasswordChange: false });
const presidentAccount = Object.freeze({
  userId: "president-coca", name: "Álvaro S.", username: "alvaro.coca",
  clubId: "ca-coca-jrs", isAdmin: false, requiresPasswordChange: true,
});

test("solo un administrador con contraseña definitiva y sin recuperación puede previsualizar usuarios", () => {
  assert.equal(canStartUserPreview(administrator), true);
  assert.equal(canStartUserPreview(administrator, true), false);
  assert.equal(canStartUserPreview({ ...administrator, requiresPasswordChange: true }), false);
  for (const role of ["president", "staff", "member", undefined]) {
    assert.equal(canStartUserPreview({ ...administrator, role }), false);
  }
  assert.equal(canStartUserPreview(null), false);
  assert.equal(canStartUserPreview(undefined), false);
});

test("la proyección rechaza cuentas incompletas, administrativas y de clubes ajenos al catálogo", () => {
  for (const account of [
    null, undefined, {},
    { ...presidentAccount, userId: null },
    { ...presidentAccount, userId: "" },
    { ...presidentAccount, username: "" },
    { ...presidentAccount, username: null },
    { ...presidentAccount, isAdmin: true },
    { ...presidentAccount, clubId: "unknown-club" },
    { ...presidentAccount, clubId: null },
  ]) assert.equal(createPreviewViewer(account, clubs), null);
  assert.equal(createPreviewViewer(presidentAccount, []), null);
});

test("la identidad proyectada abre el panel sin alterar la cuenta real ni el administrador", () => {
  const beforeAccount = structuredClone(presidentAccount);
  const beforeAdministrator = structuredClone(administrator);
  const projected = createPreviewViewer(presidentAccount, clubs);
  assert.deepEqual(projected, {
    id: "president-coca", name: "Álvaro S.", username: "alvaro.coca", clubId: "ca-coca-jrs",
    role: "president", requiresPasswordChange: false, source: "preview",
  });
  assert.notEqual(projected, presidentAccount);
  assert.deepEqual(presidentAccount, beforeAccount);
  assert.deepEqual(administrator, beforeAdministrator);
  assert.equal(createPreviewViewer({ ...presidentAccount, name: "" }, clubs).name, "alvaro.coca");
});

test("la vista administrativa omite siempre el paso temporal sin marcar la contraseña real como cambiada", () => {
  assert.equal(createPreviewViewer(presidentAccount, clubs).requiresPasswordChange, false);
  assert.equal(presidentAccount.requiresPasswordChange, true);
  assert.equal(createPreviewViewer({ ...presidentAccount, requiresPasswordChange: false }, clubs).requiresPasswordChange, false);
});

test("el portal abre directamente en preview mientras exige el cambio al presidente real", () => {
  const beforeAccount = structuredClone(presidentAccount);
  const projected = createPreviewViewer(presidentAccount, clubs);
  const actualPresident = Object.freeze({
    id: presidentAccount.userId, name: presidentAccount.name, username: presidentAccount.username,
    clubId: presidentAccount.clubId, role: "president", source: "supabase",
    requiresPasswordChange: presidentAccount.requiresPasswordChange,
  });
  const previewAccess = resolveClubPortalAccess(projected, clubs);
  assert.equal(previewAccess.status, "ready");
  assert.equal(previewAccess.club.id, "ca-coca-jrs");
  assert.equal(resolveClubPortalAccess(actualPresident, clubs).status, "password-change");
  assert.equal(actualPresident.requiresPasswordChange, true);
  assert.deepEqual(presidentAccount, beforeAccount);

  const guard = createPreviewWriteGuard();
  guard.setLocked(true);
  let writes = 0;
  const save = guard.wrap(() => { writes += 1; });
  assert.deepEqual(save(), { ok: false, error: PREVIEW_READ_ONLY_MESSAGE });
  assert.equal(writes, 0);
});

function createLeagueFixture() {
  const matchdays = Object.freeze([Object.freeze({
    id: "current-phase-j1",
    matches: Object.freeze([
      Object.freeze({ id: "current-coca-home", homeClubId: "ca-coca-jrs", awayClubId: "pico-fc" }),
      Object.freeze({ id: "current-coca-away", homeClubId: "pico-fc", awayClubId: "ca-coca-jrs" }),
      Object.freeze({ id: "current-other-clubs", homeClubId: "urss-fc", awayClubId: "bee-fc" }),
    ]),
  })]);
  const lineups = Object.freeze([
    Object.freeze({ id: "coca-current-home", clubId: "ca-coca-jrs", matchId: "current-coca-home", state: "draft" }),
    Object.freeze({ id: "coca-current-away", clubId: "ca-coca-jrs", matchId: "current-coca-away", state: "submitted" }),
    Object.freeze({ id: "admin-current", clubId: "pico-fc", matchId: "current-coca-home", state: "draft" }),
    Object.freeze({ id: "other-club-current", clubId: "urss-fc", matchId: "current-other-clubs", state: "draft" }),
    Object.freeze({ id: "coca-old-phase", clubId: "ca-coca-jrs", matchId: "historic-phase-match", state: "draft" }),
    Object.freeze({ id: "coca-unrelated-match", clubId: "ca-coca-jrs", matchId: "current-other-clubs", state: "draft" }),
  ]);
  const league = Object.freeze({
    clubs, matchdays,
    news: Object.freeze([Object.freeze({ id: "published-news" })]),
    players: Object.freeze([Object.freeze({ id: "public-player" })]),
    adminNews: Object.freeze([Object.freeze({ id: "private-draft" })]),
    auditEvents: Object.freeze([Object.freeze({ id: "private-audit" })]),
    lineups,
  });
  return { league, lineups };
}

test("la liga proyectada oculta noticias privadas y auditoría y limita alineaciones al club y fase actual", () => {
  const { league, lineups } = createLeagueFixture();
  const before = structuredClone(league);
  const viewer = createPreviewViewer(presidentAccount, clubs);
  const projected = projectPreviewLeague(league, viewer, lineups);
  assert.notEqual(projected, league);
  assert.deepEqual(projected.adminNews, []);
  assert.deepEqual(projected.auditEvents, []);
  assert.deepEqual(projected.lineups.map((row) => row.id), ["coca-current-home", "coca-current-away"]);
  assert.equal(projected.news, league.news);
  assert.equal(projected.players, league.players);
  assert.equal(projected.clubs, league.clubs);
  assert.equal(projected.matchdays, league.matchdays);
  assert.deepEqual(league, before);
});

test("el filtro defensivo sigue ocultando alineaciones cuando recibe una identidad con cambio pendiente", () => {
  const { league, lineups } = createLeagueFixture();
  const viewer = { ...createPreviewViewer(presidentAccount, clubs), requiresPasswordChange: true };
  const projected = projectPreviewLeague(league, viewer, lineups);
  assert.deepEqual(projected.lineups, []);
  assert.deepEqual(projected.adminNews, []);
  assert.deepEqual(projected.auditEvents, []);
});

test("sin una lectura privada explícita no se reutilizan alineaciones de la sesión administrativa", () => {
  const { league } = createLeagueFixture();
  const viewer = createPreviewViewer(presidentAccount, clubs);
  assert.deepEqual(projectPreviewLeague(league, viewer).lineups, []);
  assert.deepEqual(projectPreviewLeague({ ...league, matchdays: [] }, viewer, league.lineups).lineups, []);
});

test("el guard incluye cada acción de escritura y de sesión expuesta por el contexto", () => {
  assert.deepEqual(PREVIEW_BLOCKED_ACTIONS, [
    "signInAsDemo", "signInWithSupabase", "updatePassword", "signOut",
    "updateMatchResult", "clearMatchResult", "updateMatchdayConfiguration", "updateMatchSchedule",
    "addPlayer", "addNews", "saveNews", "addMatchEvent", "submitLineup", "resetDemo",
  ]);
});

test("las acciones capturadas antes de entrar quedan bloqueadas y se reanudan al salir", async () => {
  const guard = createPreviewWriteGuard();
  const invocations = [];
  const notices = [];
  const value = Object.fromEntries(PREVIEW_BLOCKED_ACTIONS.map((name) => [name, async (...args) => {
    invocations.push({ name, args });
    return { ok: true, name };
  }]));
  const captured = guardPreviewActions(value, guard, (message) => notices.push(message));
  assert.equal(guard.isLocked(), false);
  for (const name of PREVIEW_BLOCKED_ACTIONS) {
    assert.deepEqual(await captured[name]("before"), { ok: true, name });
  }
  const countBeforePreview = invocations.length;
  guard.setLocked(true);
  assert.equal(guard.isLocked(), true);
  for (const name of PREVIEW_BLOCKED_ACTIONS) {
    assert.deepEqual(await captured[name]("during"), { ok: false, error: PREVIEW_READ_ONLY_MESSAGE });
  }
  assert.equal(invocations.length, countBeforePreview);
  assert.deepEqual(notices, PREVIEW_BLOCKED_ACTIONS.map(() => PREVIEW_READ_ONLY_MESSAGE));
  guard.setLocked(false);
  for (const name of PREVIEW_BLOCKED_ACTIONS) {
    assert.deepEqual(await captured[name]("after"), { ok: true, name });
  }
  assert.equal(invocations.length, countBeforePreview * 2);
  assert.equal(invocations.some((call) => call.args.includes("during")), false);
});

test("el guard no altera argumentos ni resultados cuando no existe vista previa", () => {
  const guard = createPreviewWriteGuard();
  const input = Object.freeze({ clubId: "pico-fc" });
  const response = Object.freeze({ ok: true });
  const wrapped = guard.wrap((first, second) => {
    assert.equal(first, input);
    assert.equal(second, "draft");
    return response;
  });
  assert.equal(wrapped(input, "draft"), response);
  guard.setLocked(true);
  assert.deepEqual(wrapped(input, "draft"), { ok: false, error: PREVIEW_READ_ONLY_MESSAGE });
  guard.setLocked(false);
  assert.equal(wrapped(input, "draft"), response);
});
