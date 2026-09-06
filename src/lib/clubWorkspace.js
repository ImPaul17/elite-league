// Preview is presentation-only. It never changes the authenticated identity.
export function readClubWorkspaceRoute(path) {
  const [pathname, query = ""] = path.split("?", 2);
  if (pathname === "/club/admin" || pathname === "/admin") return { section: "admin" };
  if (pathname !== "/club") return null;
  const params = new URLSearchParams(query);
  return { section: "team", previewClubId: params.has("preview") ? params.get("preview") : null };
}

export function resolveClubPortalAccess(viewer, clubs, previewClubId = null) {
  if (!viewer) return { status: "anonymous" };
  if (viewer.requiresPasswordChange) return { status: "password-change" };
  const isPreview = previewClubId !== null;
  if (isPreview && viewer.role !== "admin") return { status: "forbidden" };
  const club = clubs.find((candidate) => candidate.id === (isPreview ? previewClubId : viewer.clubId));
  if (!club) return { status: isPreview ? "unknown-club" : "unassigned" };
  return {
    status: "ready",
    club,
    isPreview,
    canWrite: !isPreview && ["admin", "president", "staff"].includes(viewer.role),
  };
}
