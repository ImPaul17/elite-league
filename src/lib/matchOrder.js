export const MATCHES_PER_MATCHDAY = 6;

// The index stays local to its matchday; only the displayed order spans the day.
export function getMatchdayMatchOrder(matchdayNumber, matchIndex) {
  return ((matchdayNumber - 1) % 2) * MATCHES_PER_MATCHDAY + matchIndex + 1;
}

// An unpaired final matchday shares its competition day with the playoffs.
export function getPlayoffMatchOrder(lastRegularMatchdayNumber, matchIndex) {
  const regularMatchesThatDay = lastRegularMatchdayNumber % 2 === 1 ? MATCHES_PER_MATCHDAY : 0;
  return regularMatchesThatDay + matchIndex + 1;
}
