import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getRouteParts, readHashRoute } from "./routes";
import { ActionToast, AppFooter, AppHeader, Notice, PageHero } from "./components/ui";
import { LeagueProvider, useLeague } from "./context/LeagueContext";
import { UserPreviewProvider } from "./context/UserPreviewContext";
import { AdminPage } from "./pages/AdminPage";
import { AccountPage } from "./pages/AccountPage";
import { ClubPortalPage } from "./pages/ClubPortalPage";
import { CompetitionPage } from "./pages/CompetitionPage";
import { HomePage } from "./pages/HomePage";
import { MatchesPage } from "./pages/MatchesPage";
import { NewsPage } from "./pages/NewsPage";
import { StandingsPage } from "./pages/StandingsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { TeamPage } from "./pages/TeamPage";
import { TeamsPage } from "./pages/TeamsPage";
import { getCompetitionEdition, getClubProfile } from "./data/history";
import { readClubWorkspaceRoute } from "./lib/clubWorkspace";

function isStandingsEdition(edition) {
  return edition?.type === "split" || edition?.type === "cup";
}

function RouteView({ path }) {
  const { league, viewer } = useLeague();
  const parts = getRouteParts(path);
  const workspace = readClubWorkspaceRoute(path);
  if (workspace?.section === "team") return <ClubPortalPage key={`${viewer?.id ?? "anonymous"}:${workspace.previewClubId ?? "own"}`} previewClubId={workspace.previewClubId} />;
  if (workspace?.section === "admin") return <AdminPage />;
  if (path === "/") return <HomePage />;
  if (path === "/clasificacion") return <StandingsPage />;
  if (parts[0] === "clasificacion" && parts[1] && !parts[2] && isStandingsEdition(getCompetitionEdition(parts[1]))) return <StandingsPage editionId={parts[1]} />;
  if (path === "/partidos") return <MatchesPage />;
  if (parts[0] === "partidos" && parts[1] && !parts[2] && getCompetitionEdition(parts[1])) return <MatchesPage editionId={parts[1]} />;
  if (path === "/equipos") return <TeamsPage />;
  if (parts[0] === "equipos" && parts[1] && !parts[2] && getCompetitionEdition(parts[1])) return <TeamsPage editionId={parts[1]} />;
  if (parts[0] === "equipos" && parts[1]) {
    const club = getClubProfile(parts[1], league.clubs);
    const editionId = getCompetitionEdition(parts[2])?.id ?? "split-3";
    return club ? <TeamPage club={club} editionId={editionId} /> : <NotFoundPage />;
  }
  if (path === "/estadisticas") return <StatisticsPage />;
  if (path === "/noticias") return <NewsPage />;
  if (parts[0] === "noticias" && parts[1]) return <NewsPage articleId={parts[1]} />;
  if (path === "/competicion") return <CompetitionPage />;
  if (path === "/cuenta") return <AccountPage key={viewer?.id ?? "anonymous"} />;
  return <NotFoundPage />;
}

function NotFoundPage() {
  return <PageHero eyebrow="404" title="Esta página no existe" description="Vuelve al inicio para continuar navegando por Elite League." />;
}

function isEditionDirectoryPath(path) {
  const parts = getRouteParts(path);
  return parts.length === 2 && parts[0] === "equipos" && Boolean(getCompetitionEdition(parts[1]));
}

function isMatchesEditionPath(path) {
  const parts = getRouteParts(path);
  return parts[0] === "partidos" && (parts.length === 1 || (parts.length === 2 && Boolean(getCompetitionEdition(parts[1]))));
}

function isStandingsEditionPath(path) {
  const parts = getRouteParts(path);
  return parts[0] === "clasificacion" && (parts.length === 1 || (parts.length === 2 && isStandingsEdition(getCompetitionEdition(parts[1]))));
}

function isClubProfilePath(path) {
  const parts = getRouteParts(path);
  return parts[0] === "equipos" && Boolean(parts[1]) && (Boolean(parts[2]) || !getCompetitionEdition(parts[1]));
}

function isSameClubProfile(previousPath, nextPath) {
  if (!previousPath || !isClubProfilePath(previousPath) || !isClubProfilePath(nextPath)) return false;
  const previousParts = getRouteParts(previousPath);
  const nextParts = getRouteParts(nextPath);
  return previousParts[1] === nextParts[1];
}

function AppContent() {
  const [path, setPath] = useState(readHashRoute);
  const previousPathRef = useRef(null);
  const { dataStatus, isDemoMode } = useLeague();
  const reduceMotion = useReducedMotion();
  const profileTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.22, 0.8, 0.2, 1] };
  const isProfileRoute = isClubProfilePath(path);
  const profileClubId = isProfileRoute ? getRouteParts(path)[1] : null;

  useEffect(() => {
    const handleNavigation = () => setPath(readHashRoute());
    window.addEventListener("hashchange", handleNavigation);
    return () => window.removeEventListener("hashchange", handleNavigation);
  }, []);

  useEffect(() => {
    const parts = getRouteParts(path);
    const titleMap = {
      "/": "Elite League · Split 3",
      "/clasificacion": "Clasificación · Elite League",
      "/partidos": "Partidos · Elite League",
      "/equipos": "Equipos · Elite League",
      "/estadisticas": "Estadísticas · Elite League",
      "/noticias": "Noticias · Elite League",
      "/competicion": "Competición · Elite League",
      "/club": "Mi equipo · Elite League",
      "/club/admin": "Administración · Elite League",
      "/admin": "Administración · Elite League",
      "/cuenta": "Mi cuenta · Elite League",
    };
    const selectedMatchesEdition = parts[0] === "partidos" && parts[1] ? getCompetitionEdition(parts[1]) : null;
    const selectedStandingsEdition = parts[0] === "clasificacion" && parts[1] ? getCompetitionEdition(parts[1]) : null;
    document.title = selectedMatchesEdition
      ? `Partidos · ${selectedMatchesEdition.label} · Elite League`
      : isStandingsEdition(selectedStandingsEdition)
        ? `Clasificación · ${selectedStandingsEdition.label} · Elite League`
        : readClubWorkspaceRoute(path)?.previewClubId != null ? "Vista previa del equipo · Elite League" : titleMap[path] ?? "Elite League";
    const shouldKeepScroll = previousPathRef.current && (
      (isEditionDirectoryPath(previousPathRef.current) && isEditionDirectoryPath(path))
      || (isMatchesEditionPath(previousPathRef.current) && isMatchesEditionPath(path))
      || (isStandingsEditionPath(previousPathRef.current) && isStandingsEditionPath(path))
      || isSameClubProfile(previousPathRef.current, path)
    );
    if (!shouldKeepScroll) window.scrollTo({ top: 0, behavior: "auto" });
    previousPathRef.current = path;
  }, [path]);

  return (
    <div className="app-shell">
      <AppHeader activePath={path} />
      <main id="main-content" className="shell page-content">
        {!isDemoMode && dataStatus === "loading" && <Notice tone="info">Cargando los datos oficiales de la competición…</Notice>}
        {!isDemoMode && dataStatus === "error" && <Notice tone="warning">No se han podido cargar los datos oficiales. Revisa la conexión con Supabase; el contenido mostrado puede ser solo la plantilla local.</Notice>}
        {isProfileRoute ? (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              className="club-profile-route-transition"
              key={profileClubId}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={profileTransition}
            >
              <RouteView path={path} />
            </motion.div>
          </AnimatePresence>
        ) : <RouteView path={path} />}
      </main>
      <AppFooter />
      <ActionToast />
    </div>
  );
}

export default function App() {
  return <LeagueProvider><UserPreviewProvider><AppContent /></UserPreviewProvider></LeagueProvider>;
}
