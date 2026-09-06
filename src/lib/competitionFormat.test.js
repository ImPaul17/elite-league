import test from "node:test";
import assert from "node:assert/strict";
import { CLUBS, MATCHDAYS, COMPETITION_RULES } from "../data/league.js";
import { SPLIT_3_PLAYOFF_QUALIFICATION, SPLIT_3_PLAYOFF_STAGES } from "../data/split3Playoffs.js";

test("el formato publicado coincide con los doce equipos, once jornadas y 66 cruces únicos", () => {
  assert.equal(CLUBS.length, 12);
  assert.equal(MATCHDAYS.length, 11);
  const pairs = MATCHDAYS.flatMap(day => {
    assert.equal(day.matches.length, 6);
    return day.matches.map(match => [match.homeClubId, match.awayClubId].sort().join(":"));
  });
  assert.equal(new Set(pairs).size, 66);
});

test("cada posición tiene el destino de playoff confirmado y solo el duodécimo queda fuera", () => {
  const positions = Object.fromEntries(SPLIT_3_PLAYOFF_QUALIFICATION.map(row => [row.id, row.positions]));
  assert.deepEqual(positions, {
    semifinals: [1], quarterfinals: [2, 3, 4], "round-of-16": [5, 6, 7, 8, 9], "last-octavos-place": [10, 11], eliminated: [12],
  });
  assert.deepEqual(SPLIT_3_PLAYOFF_QUALIFICATION.flatMap(row => row.positions), Array.from({length: 12}, (_, i) => i + 1));
});

test("las plazas directas y los ganadores completan cada ronda del playoff", () => {
  let winners = 0;
  for (const stage of SPLIT_3_PLAYOFF_STAGES) {
    const direct = SPLIT_3_PLAYOFF_QUALIFICATION.find(row => row.id === stage.id)?.positions.length ?? 0;
    assert.equal(direct + winners, stage.matches.length * 2);
    winners = stage.matches.length;
  }
  assert.equal(winners, 1);
  assert.deepEqual(COMPETITION_RULES.points, {win: 3, penaltyWin: 2, penaltyLoss: 1, loss: 0});
});
