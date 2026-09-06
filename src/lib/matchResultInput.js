const MAX_SCORE = 32767; // PostgreSQL smallint, used by the result RPC and table.

function isBlank(value) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function parseScore(value) {
  if (typeof value === "string") {
    const text = value.trim();
    if (!/^\d+$/.test(text)) return null;
    value = Number(text);
  }
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_SCORE ? value : null;
}

export function validateMatchResultInput({ homeScore, awayScore, homePenalties, awayPenalties }) {
  if (isBlank(homeScore) || isBlank(awayScore)) {
    return { ok: false, error: "Introduce el marcador de los dos equipos. Un campo vacío no cuenta como cero." };
  }
  const home = parseScore(homeScore);
  const away = parseScore(awayScore);
  if (home == null || away == null) {
    return { ok: false, error: "Introduce un marcador válido de números enteros no negativos." };
  }

  const hasHomePenalties = !isBlank(homePenalties);
  const hasAwayPenalties = !isBlank(awayPenalties);
  if (home !== away && (hasHomePenalties || hasAwayPenalties)) {
    return { ok: false, error: "Los penaltis solo se registran si el partido termina empatado." };
  }
  const homePenaltyScore = hasHomePenalties ? parseScore(homePenalties) : null;
  const awayPenaltyScore = hasAwayPenalties ? parseScore(awayPenalties) : null;
  if (home === away && (homePenaltyScore == null || awayPenaltyScore == null || homePenaltyScore === awayPenaltyScore)) {
    return { ok: false, error: "Un empate necesita penaltis enteros no negativos para los dos equipos y un ganador." };
  }
  return { ok: true, homeScore: home, awayScore: away, homePenalties: homePenaltyScore, awayPenalties: awayPenaltyScore };
}
