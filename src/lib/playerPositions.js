export const PLAYER_ROSTER_GROUPS = [
  { id: "GK", label: "Porteros" },
  { id: "DEF", label: "Defensas" },
  { id: "MID", label: "Centrocampistas" },
  { id: "FWD", label: "Delanteros" },
];

function positionKey(value) {
  return typeof value === "string"
    ? value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase()
    : "";
}

const POSITION_DEFINITIONS = [
  ["POR", "GK", ["GK", "Goalkeeper", "Goal Keeper", "Keeper", "Portero", "Guardameta"]],
  ["DFC", "DEF", ["CB", "LCB", "RCB", "SW", "Center Back", "Centre Back", "Central Defender", "Left Center Back", "Right Center Back", "Left Centre Back", "Right Centre Back", "Sweeper", "Defensa central", "Central", "Libero"]],
  ["LI", "DEF", ["LB", "Left Back", "Lateral izquierdo"]],
  ["LD", "DEF", ["RB", "Right Back", "Lateral derecho"]],
  ["CAI", "DEF", ["LWB", "Left Wing Back", "Carrilero izquierdo"]],
  ["CAD", "DEF", ["RWB", "Right Wing Back", "Carrilero derecho"]],
  ["MCD", "MID", ["CDM", "LDM", "RDM", "Defensive Midfielder", "Defensive Midfield", "Central Defensive Midfielder", "Center Defensive Midfielder", "Centre Defensive Midfielder", "Left Defensive Midfielder", "Right Defensive Midfielder", "Mediocentro defensivo"]],
  ["MC", "MID", ["CM", "LCM", "RCM", "Central Midfielder", "Central Midfield", "Center Midfielder", "Centre Midfielder", "Left Central Midfielder", "Right Central Midfielder", "Left Center Midfielder", "Right Center Midfielder", "Left Centre Midfielder", "Right Centre Midfielder", "Mediocentro", "Mediocentro normal"]],
  ["MI", "MID", ["LM", "Left Midfielder", "Left Midfield", "Medio izquierdo", "Interior izquierdo"]],
  ["MD", "MID", ["RM", "Right Midfielder", "Right Midfield", "Medio derecho", "Interior derecho"]],
  ["MCO", "MID", ["CAM", "LAM", "RAM", "Attacking Midfielder", "Attacking Midfield", "Central Attacking Midfielder", "Center Attacking Midfielder", "Centre Attacking Midfielder", "Left Attacking Midfielder", "Right Attacking Midfielder", "Mediocentro ofensivo", "Mediapunta"]],
  ["SD", "FWD", ["CF", "SS", "Center Forward", "Centre Forward", "Second Striker", "Secondary Striker", "Support Striker", "Segundo delantero"]],
  ["DC", "FWD", ["ST", "LS", "RS", "Striker", "Left Striker", "Right Striker", "Delantero", "Delantero centro"]],
  ["EI", "FWD", ["LW", "Left Wing", "Left Winger", "Extremo izquierdo"]],
  ["ED", "FWD", ["RW", "Right Wing", "Right Winger", "Extremo derecho"]],
];

const POSITIONS = new Map(POSITION_DEFINITIONS.flatMap(([abbreviation, group, aliases]) => (
  [abbreviation, ...aliases].map((alias) => [positionKey(alias), { abbreviation, group }])
)));

const EMPTY_POSITIONS = new Set(["", "NONE", "NA", "NULL", "SINPOSICION", "NOPOSITION"]);

function sourcePositions(player) {
  const splitPositions = (value) => (Array.isArray(value) ? value : [value])
    .filter((position) => !EMPTY_POSITIONS.has(positionKey(position)))
    .flatMap((position) => typeof position === "string" ? position.split(/[,;/|·]/) : [])
    .map(positionKey)
    .filter((key) => !EMPTY_POSITIONS.has(key));
  const positions = splitPositions(player?.positions);
  return positions.length ? positions : splitPositions(player?.position);
}

/** Known positions only, translated to Spanish FIFA abbreviations in preference order. */
export function getPlayerPositions(player) {
  return [...new Set(sourcePositions(player).map((key) => POSITIONS.get(key)?.abbreviation).filter(Boolean))];
}

const GROUP_ALIASES = new Map([
  ["GK", "GK"], ["POR", "GK"], ["GOALKEEPER", "GK"], ["PORTERO", "GK"],
  ["DEF", "DEF"], ["DEFENDER", "DEF"], ["DEFENCE", "DEF"], ["DEFENSE", "DEF"], ["DEFENSA", "DEF"],
  ["MID", "MID"], ["MIDFIELDER", "MID"], ["MIDFIELD", "MID"], ["CENTROCAMPISTA", "MID"], ["MEDIOCAMPISTA", "MID"],
  ["FWD", "FWD"], ["FORWARD", "FWD"], ["ATTACKER", "FWD"], ["DELANTERO", "FWD"],
]);

/** A player belongs to one line, determined by their primary (not secondary) position. */
export function getPlayerRosterGroup(player) {
  const [primary] = sourcePositions(player);
  if (primary) return POSITIONS.get(primary)?.group ?? null;
  return GROUP_ALIASES.get(positionKey(player?.positionGroup)) ?? null;
}
