export function getPlayerFullName(player) {
  return [player.firstName, player.lastName].filter(Boolean).join(" ").trim();
}

export function getPlayerDisplayName(player) {
  return player.commonName?.trim() || getPlayerFullName(player);
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
  if (player.positionGroup !== "GK") return FIELD_SUMMARY.map(([id, label, shortLabel]) => ({
    id, label, shortLabel, value: player.summary?.[id] ?? null,
  }));
  const attributes = player.attributes;
  return [
    { id: "gkdiving", label: "Estirada", shortLabel: "EST", value: attributes.gkdiving },
    { id: "gkhandling", label: "Parada", shortLabel: "PAR", value: attributes.gkhandling },
    { id: "gkkicking", label: "Chute", shortLabel: "CHU", value: attributes.gkkicking },
    { id: "gkreflexes", label: "Reflejos", shortLabel: "REF", value: attributes.gkreflexes },
    // FC25's cached CARD fields disagree with this customised player's actual
    // attributes. No verified FC25 speed formula: show both exact inputs.
    { id: "speed", label: "Velocidad", shortLabel: "VEL", value: null,
      parts: [{ label: "Aceleración", value: attributes.acceleration }, { label: "Sprint", value: attributes.sprintspeed }] },
    { id: "gkpositioning", label: "Posición", shortLabel: "POS", value: attributes.gkpositioning },
  ];
}

export function getAttributeTone(value) {
  return value >= 80 ? "high" : value >= 60 ? "medium" : "low";
}
