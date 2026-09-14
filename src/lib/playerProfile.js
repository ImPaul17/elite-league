import { getPlayerPositions, getPlayerRosterGroup } from "./playerPositions.js";

export function getPlayerFullName(player) {
  return [player.firstName, player.lastName].filter(Boolean).join(" ").trim();
}

export function getPlayerDisplayName(player) {
  return player.commonName?.trim() || getPlayerFullName(player);
}

function isPlayerGoalkeeper(player) {
  return getPlayerRosterGroup(player) === "GK";
}

export function getPlayerPositionLabel(player) {
  if (isPlayerGoalkeeper(player)) return "POR";
  return getPlayerPositions(player).join(" · ") || "Jugador de campo";
}

export function getPlayerCardStatistics(player) {
  // A profile snapshot belongs to one edition; missing data is not a zero.
  const stats = player.editionId && player.competitionStats?.editionId === player.editionId
    ? player.competitionStats : null;
  const definitions = [
    ["appearances", "Partidos"],
    isPlayerGoalkeeper(player) ? ["goalsConceded", "Goles encajados"] : ["goals", "Goles"],
    ["yellowCards", "Amarillas"],
    ["blueCards", "Azules"],
  ];
  return definitions.map(([id, label]) => ({
    id, label, value: Number.isInteger(stats?.[id]) && stats[id] >= 0 ? stats[id] : null,
  }));
}

export function formatPlayerBirthDate(value) {
  if (!value) return "No disponible";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "No disponible" : new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(date);
}

export const PLAYER_ATTRIBUTE_GROUPS = [
  { id: "goalkeeping", label: "Portería", attributes: [
    ["gkdiving", "Estirada"], ["gkhandling", "Parada"], ["gkkicking", "Chute"],
    ["gkreflexes", "Reflejos"], ["gkpositioning", "Posición"],
  ] },
  { id: "pace", label: "Ritmo", attributes: [["acceleration", "Aceleración"], ["sprintspeed", "Velocidad de sprint"]] },
  { id: "shooting", label: "Tiro", attributes: [
    ["positioning", "Posicionamiento ofensivo"], ["finishing", "Definición"], ["shotpower", "Potencia de tiro"],
    ["longshots", "Tiros lejanos"], ["volleys", "Voleas"], ["penalties", "Penaltis"],
  ] },
  { id: "passing", label: "Pase", attributes: [
    ["vision", "Visión"], ["crossing", "Centros"], ["freekickaccuracy", "Precisión de faltas"],
    ["shortpassing", "Pase corto"], ["longpassing", "Pase largo"], ["curve", "Efecto"],
  ] },
  { id: "dribbling", label: "Regate", attributes: [
    ["agility", "Agilidad"], ["balance", "Equilibrio"], ["reactions", "Reacciones"],
    ["ballcontrol", "Control de balón"], ["dribbling", "Regates"], ["composure", "Compostura"],
  ] },
  { id: "defending", label: "Defensa", attributes: [
    ["interceptions", "Intercepciones"], ["headingaccuracy", "Precisión de cabeza"],
    ["defensiveawareness", "Percepción defensiva"], ["standingtackle", "Entrada normal"], ["slidingtackle", "Entrada agresiva"],
  ] },
  { id: "physical", label: "Físico", attributes: [
    ["jumping", "Salto"], ["stamina", "Resistencia"], ["strength", "Fuerza"], ["aggression", "Agresividad"],
  ] },
];

const FIELD_SUMMARY = [
  ["pace", "Ritmo", "RIT"], ["shooting", "Tiro", "TIR"], ["passing", "Pase", "PAS"],
  ["dribbling", "Regate", "REG"], ["defending", "Defensa", "DEF"], ["physical", "Físico", "FIS"],
];

export function getPlayerSummary(player) {
  if (!isPlayerGoalkeeper(player)) return FIELD_SUMMARY.map(([id, label, shortLabel]) => ({
    id, label, shortLabel, value: player.summary?.[id] ?? null,
  }));
  const attributes = player.attributes;
  return [
    { id: "gkdiving", label: "Estirada", shortLabel: "EST", value: attributes.gkdiving },
    { id: "gkhandling", label: "Parada", shortLabel: "PAR", value: attributes.gkhandling },
    { id: "gkkicking", label: "Chute", shortLabel: "CHU", value: attributes.gkkicking },
    { id: "gkreflexes", label: "Reflejos", shortLabel: "REF", value: attributes.gkreflexes },
    { id: "speed", label: "Velocidad", shortLabel: "VEL", value: player.summary?.speed ?? null },
    { id: "gkpositioning", label: "Posición", shortLabel: "POS", value: attributes.gkpositioning },
  ];
}

export function getAttributeTone(value) {
  if (!Number.isFinite(value)) return "neutral";
  return value >= 80 ? "high" : value >= 70 ? "good" : value >= 60 ? "medium" : value >= 40 ? "low" : "very-low";
}
