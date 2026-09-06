import assert from "node:assert/strict";
import test from "node:test";
import { getFormationPermissions } from "./formationPermissions.js";

const now = Date.parse("2026-09-07T12:00:00Z");
const future = "2026-09-07T13:00:00Z";
const past = "2026-09-07T11:00:00Z";

test("una vista previa nunca habilita la edición, incluso para administración", () => {
  for (const viewerRole of ["admin", "president", "staff", "member", undefined]) {
    for (const lineupDeadline of [null, future, past]) {
      const permissions = getFormationPermissions({ readOnly: true, canManage: true, viewerRole, lineupDeadline, now });
      assert.equal(permissions.canEdit, false);
      assert.equal(permissions.hasAdminPrivileges, false);
    }
  }
});

test("la vista previa de administración muestra los plazos como los ve presidencia", () => {
  for (const lineupDeadline of [null, future, past, new Date(now).toISOString()]) {
    const preview = getFormationPermissions({ readOnly: true, canManage: true, viewerRole: "admin", lineupDeadline, now });
    const president = getFormationPermissions({ canManage: true, viewerRole: "president", lineupDeadline, now });
    assert.equal(preview.deadlinePassed, president.deadlinePassed);
  }
});

test("fuera de vista previa conserva la edición autorizada y el privilegio administrativo", () => {
  assert.deepEqual(getFormationPermissions({ canManage: true, viewerRole: "admin", lineupDeadline: past, now }), {
    canEdit: true, deadlinePassed: false, hasAdminPrivileges: true,
  });
  assert.equal(getFormationPermissions({ canManage: true, viewerRole: "president", lineupDeadline: future, now }).canEdit, true);
  assert.equal(getFormationPermissions({ canManage: true, viewerRole: "president", lineupDeadline: past, now }).canEdit, false);
});

test("el rol no sustituye un permiso de gestión denegado", () => {
  for (const viewerRole of ["admin", "president", "staff", undefined]) {
    assert.equal(getFormationPermissions({ canManage: false, viewerRole, now }).canEdit, false);
  }
  assert.equal(getFormationPermissions({ now }).canEdit, false);
});

test("la comprobación del plazo se actualiza en cada llamada, no solo al renderizar", () => {
  const input = { canManage: true, viewerRole: "president", lineupDeadline: future };
  assert.equal(getFormationPermissions({ ...input, now }).canEdit, true);
  assert.equal(getFormationPermissions({ ...input, now: Date.parse(future) }).canEdit, false);
});
