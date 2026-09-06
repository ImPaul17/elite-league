import assert from "node:assert/strict";
import test from "node:test";
import { CLUBS, MATCHDAYS } from "../data/league.js";
import { getHistoricCompetitionData } from "../data/historyResults.js";
import { MATCHES_PER_MATCHDAY, getMatchdayMatchOrder, getPlayoffMatchOrder } from "./matchOrder.js";

const sequence = (start, length) => Array.from({ length }, (_, index) => start + index);
const historicalEditions = [
  { id: "split-1", matchdays: 11, playoffStages: [["Cuartos de final", 4], ["Semifinales", 2], ["Final", 1]] },
  { id: "split-2", matchdays: 11, playoffStages: [["Octavos de final", 3], ["Cuartos de final", 3], ["Semifinales", 2], ["Final", 1]] },
  { id: "elite-cup", matchdays: 5, playoffStages: [["Cuartos de final", 4], ["Semifinales", 2], ["Final", 1]] },
];

test("el orden local de seis partidos se alterna entre 1–6 y 7–12 por jornada", () => {
  assert.equal(MATCHES_PER_MATCHDAY, 6);
  for (let number = 1; number <= 12; number += 1) {
    assert.deepEqual(
      sequence(0, 6).map(index => getMatchdayMatchOrder(number, index)),
      number % 2 === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12],
      `J${number}`,
    );
  }
});

test("la numeración conserva huecos al usar el índice local persistido de una lectura parcial", () => {
  const persistedLocalOrders = [2, 5];
  assert.deepEqual(persistedLocalOrders.map(order => getMatchdayMatchOrder(2, order - 1)), [8, 11]);
  assert.deepEqual(persistedLocalOrders.map(order => getMatchdayMatchOrder(3, order - 1)), [2, 5]);
});

test("los playoffs continúan desde el séptimo partido tras J11 o J5 sin reiniciarse en cada ronda", () => {
  for (const lastMatchday of [1, 5, 11]) {
    assert.deepEqual(sequence(0, 10).map(index => getPlayoffMatchOrder(lastMatchday, index)), sequence(7, 10));
  }
  for (const lastMatchday of [2, 6, 12]) {
    assert.deepEqual(sequence(0, 10).map(index => getPlayoffMatchOrder(lastMatchday, index)), sequence(1, 10));
  }
});

function assertRegularMatchdays(editionId, matchdays, expectedCount) {
  assert.equal(matchdays.length, expectedCount);
  assert.deepEqual(matchdays.map(matchday => matchday.number), sequence(1, expectedCount));
  const ids = [];
  for (const matchday of matchdays) {
    assert.equal(matchday.id, `${editionId}-j${matchday.number}`);
    assert.equal(matchday.matches.length, 6);
    assert.deepEqual(
      matchday.matches.map(match => match.order),
      matchday.number % 2 === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12],
      `${editionId} J${matchday.number}`,
    );
    assert.deepEqual(
      matchday.matches.map(match => match.id),
      sequence(1, 6).map(localOrder => `${editionId}-j${matchday.number}-m${localOrder}`),
      "Los IDs conservan el índice original de la jornada, no el nuevo número visible",
    );
    for (const match of matchday.matches) assert.equal(match.matchdayNumber, matchday.number);
    ids.push(...matchday.matches.map(match => match.id));
  }
  assert.equal(ids.length, expectedCount * 6);
  assert.equal(new Set(ids).size, expectedCount * 6);
  for (let index = 0; index + 1 < matchdays.length; index += 2) {
    const competitionDay = [...matchdays[index].matches, ...matchdays[index + 1].matches];
    assert.deepEqual(competitionDay.map(match => match.order), sequence(1, 12));
  }
}

test("los 66 partidos del Split 3 alternan el orden por día y mantienen todos sus IDs", () => {
  assertRegularMatchdays("split-3", MATCHDAYS, 11);
  for (const matchday of MATCHDAYS) {
    for (const match of matchday.matches) assert.equal(match.matchdayId, matchday.id);
  }
});

for (const edition of historicalEditions) {
  test(`${edition.id}: sus ${edition.matchdays * 6} partidos regulares usan el orden diario sin cambiar IDs`, () => {
    const history = getHistoricCompetitionData(edition.id, CLUBS);
    assertRegularMatchdays(edition.id, history.regularMatchdays, edition.matchdays);
    assert.deepEqual(history.regularMatches, history.regularMatchdays.flatMap(matchday => matchday.matches));
  });

  test(`${edition.id}: los playoffs continúan desde 7 entre rondas y mantienen sus IDs históricos`, () => {
    const history = getHistoricCompetitionData(edition.id, CLUBS);
    const matches = history.playoffStages.flatMap(stage => stage.matches);
    const expectedCount = edition.playoffStages.reduce((total, [, count]) => total + count, 0);
    assert.deepEqual(history.playoffStages.map(stage => [stage.label, stage.matches.length]), edition.playoffStages);
    assert.deepEqual(matches.map(match => match.order), sequence(7, expectedCount));
    assert.deepEqual(matches.map(match => match.id), edition.playoffStages.flatMap(([label, count]) =>
      sequence(1, count).map(localOrder => `${edition.id}-playoffs-${label}-m${localOrder}`),
    ));
    assert.equal(new Set(matches.map(match => match.id)).size, expectedCount);
    const finalCompetitionDay = [...history.regularMatchdays.at(-1).matches, ...matches];
    assert.deepEqual(finalCompetitionDay.map(match => match.order), sequence(1, 6 + expectedCount));
  });
}

test("los dos grupos de Elite Cup conservan el orden global al filtrar cada jornada", () => {
  const history = getHistoricCompetitionData("elite-cup", CLUBS);
  assert.equal(history.groups.length, 2);
  const sourceById = new Map(history.regularMatches.map(match => [match.id, match]));
  const seenIds = new Set();
  for (const group of history.groups) {
    assert.equal(group.regularMatches.length, 15);
    for (const match of group.regularMatches) {
      assert.equal(match.groupId, group.id);
      assert.equal(match, sourceById.get(match.id), "Filtrar no debe reconstruir ni renumerar el partido");
      assert.ok(!seenIds.has(match.id), "Un partido pertenece a un único grupo");
      seenIds.add(match.id);
    }
    for (const matchday of history.regularMatchdays) {
      const visibleMatches = matchday.matches.filter(match => match.groupId === group.id);
      const groupMatches = group.regularMatches.filter(match => match.matchdayNumber === matchday.number);
      assert.equal(visibleMatches.length, 3);
      assert.deepEqual(groupMatches, visibleMatches);
      assert.deepEqual(
        visibleMatches.map(match => match.order),
        matchday.matches.flatMap((match, index) => match.groupId === group.id ? [index + (matchday.number % 2 === 1 ? 1 : 7)] : []),
      );
      if (matchday.number % 2 === 0) assert.ok(visibleMatches.every(match => match.order >= 7));
    }
  }
  assert.equal(seenIds.size, 30);
});
