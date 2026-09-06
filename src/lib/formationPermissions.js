export function getFormationPermissions({ readOnly = false, canManage = false, viewerRole, lineupDeadline, now = Date.now() }) {
  // A preview keeps the administrator's real session, but never its editing
  // privileges or deadline exception inside the formation controls.
  const hasAdminPrivileges = viewerRole === "admin" && !readOnly;
  const deadlineTime = lineupDeadline ? new Date(lineupDeadline).getTime() : null;
  const deadlinePassed = Boolean(deadlineTime != null && deadlineTime <= now && !hasAdminPrivileges);
  return {
    canEdit: Boolean(canManage && !readOnly && !deadlinePassed),
    deadlinePassed,
    hasAdminPrivileges,
  };
}
