import assert from "node:assert/strict";
import test from "node:test";
import { readClubWorkspaceRoute, resolveClubPortalAccess } from "./clubWorkspace.js";

const clubs = [{ id: "pico-fc" }, { id: "ca-coca-jrs" }];
const admin = { id: "pablo", role: "admin", clubId: "pico-fc", requiresPasswordChange: false };

test("Mi equipo admite vista previa explícita y conserva la ruta antigua de administración", () => {
  assert.deepEqual(readClubWorkspaceRoute("/club"), { section: "team", previewClubId: null });
  assert.deepEqual(readClubWorkspaceRoute("/club?preview=ca-coca-jrs"), { section: "team", previewClubId: "ca-coca-jrs" });
  assert.equal(readClubWorkspaceRoute("/club/admin").section, "admin");
  assert.equal(readClubWorkspaceRoute("/admin").section, "admin");
  assert.equal(readClubWorkspaceRoute("/club/otro"), null);
});

test("el administrador ve su equipo por defecto y la vista previa nunca le permite escribir", () => {
  assert.deepEqual(resolveClubPortalAccess(admin, clubs), { status: "ready", club: clubs[0], isPreview: false, canWrite: true });
  assert.deepEqual(resolveClubPortalAccess(admin, clubs, "ca-coca-jrs"), { status: "ready", club: clubs[1], isPreview: true, canWrite: false });
  assert.equal(resolveClubPortalAccess(admin, clubs, "pico-fc").canWrite, false);
  assert.equal(admin.clubId, "pico-fc");
  assert.equal(admin.role, "admin");
});

test("un presidente no cambia de club manipulando el enlace de vista previa", () => {
  const president = { ...admin, role: "president" };
  assert.equal(resolveClubPortalAccess(president, clubs).club.id, "pico-fc");
  assert.equal(resolveClubPortalAccess(president, clubs, "ca-coca-jrs").status, "forbidden");
  assert.equal(resolveClubPortalAccess(president, clubs, "pico-fc").status, "forbidden");
  assert.equal(resolveClubPortalAccess(null, clubs, "ca-coca-jrs").status, "anonymous");
});

test("la vista previa no evita el cambio de contraseña ni sustituye destinos desconocidos", () => {
  assert.equal(resolveClubPortalAccess({ ...admin, requiresPasswordChange: true }, clubs, "ca-coca-jrs").status, "password-change");
  assert.equal(resolveClubPortalAccess(admin, clubs, "missing").status, "unknown-club");
  assert.equal(resolveClubPortalAccess(admin, clubs, "").status, "unknown-club");
  assert.equal(resolveClubPortalAccess({ ...admin, clubId: null }, clubs).status, "unassigned");
  assert.equal(resolveClubPortalAccess({ ...admin, role: "member" }, clubs).canWrite, false);
});
