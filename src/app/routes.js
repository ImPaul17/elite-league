export const NAVIGATION = [
  { label: "Inicio", path: "/" },
  { label: "Clasificación", path: "/clasificacion" },
  { label: "Partidos", path: "/partidos" },
  { label: "Equipos", path: "/equipos" },
  { label: "Estadísticas", path: "/estadisticas" },
  { label: "Noticias", path: "/noticias" },
  { label: "Competición", path: "/competicion" },
];

export function readHashRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  const path = hash.startsWith("/") ? hash : `/${hash}`;
  return path === "/" || path === "" ? "/" : path.replace(/\/+$/, "");
}

export function navigate(path) {
  const normalised = path === "/" ? "/" : path.replace(/^\/?/, "/");
  window.location.hash = normalised;
}

export function getRouteParts(path) {
  return path.split("/").filter(Boolean);
}
