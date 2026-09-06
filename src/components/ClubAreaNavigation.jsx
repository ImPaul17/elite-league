import { AppLink } from "./ui";
import { useLeague } from "../context/LeagueContext";
import "./club-workspace.css";

export function ClubAreaNavigation({ section = "team" }) {
  const { viewer } = useLeague();
  if (!viewer || viewer.requiresPasswordChange) return null;
  return <nav className="club-area-navigation" aria-label="Área de mi equipo">
    <AppLink to="/club" className={section === "team" ? "is-active" : ""} aria-current={section === "team" ? "page" : undefined}>Mi equipo</AppLink>
    {viewer.role === "admin" && <AppLink to="/club/admin" className={section === "admin" ? "is-active" : ""} aria-current={section === "admin" ? "page" : undefined}>Panel de administración</AppLink>}
  </nav>;
}
