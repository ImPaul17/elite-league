import assert from "node:assert/strict";
import test from "node:test";
import { getHistoricCompetitionData } from "../data/historyResults.js";
import { calculatePlayerStatistics, calculateStandings, calculateStandingsThroughMatchday, getStatisticLeaders, validateLineup } from "./leagueEngine.js";

const clubs = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];

test("calcula 3/2/1/0 y ordena la clasificación", () => {
  const standings = calculateStandings(clubs, [
    { id: "m1", homeClubId: "a", awayClubId: "b", status: "confirmed", score: { home: 4, away: 2 }, penalties: null },
    { id: "m2", homeClubId: "b", awayClubId: "c", status: "confirmed", score: { home: 3, away: 3 }, penalties: { home: 4, away: 2 } },
  ]);

  const byClub = Object.fromEntries(standings.map((row) => [row.club.id, row]));
  assert.equal(byClub.a.points, 3);
  assert.equal(byClub.b.points, 2);
  assert.equal(byClub.c.points, 1);
  assert.equal(byClub.a.position, 1);
  assert.equal(byClub.b.position, 2);
  assert.equal(byClub.c.position, 3);
  assert.equal(byClub.b.penaltyWins, 1);
  assert.equal(byClub.c.penaltyLosses, 1);
});

test("ignora resultados no confirmados", () => {
  const standings = calculateStandings(clubs, [
    { id: "draft", homeClubId: "a", awayClubId: "b", status: "reported", score: { home: 9, away: 0 }, penalties: null },
  ]);
  assert.equal(standings.every((row) => row.played === 0 && row.points === 0), true);
});

test("acumula la clasificación hasta la jornada seleccionada", () => {
  const matchdays = [
    { number: 1, matches: [{ id: "j1", homeClubId: "a", awayClubId: "b", status: "confirmed", score: { home: 2, away: 0 }, penalties: null }] },
    { number: 2, matches: [{ id: "j2", homeClubId: "b", awayClubId: "c", status: "confirmed", score: { home: 1, away: 0 }, penalties: null }] },
  ];

  const afterFirstMatchday = calculateStandingsThroughMatchday(clubs, matchdays, 1);
  const afterSecondMatchday = calculateStandingsThroughMatchday(clubs, matchdays, 2);
  const firstByClub = Object.fromEntries(afterFirstMatchday.map((row) => [row.club.id, row]));
  const secondByClub = Object.fromEntries(afterSecondMatchday.map((row) => [row.club.id, row]));

  assert.equal(firstByClub.b.played, 1);
  assert.equal(firstByClub.c.played, 0);
  assert.equal(secondByClub.b.played, 2);
  assert.equal(secondByClub.b.points, 3);
});

test("exige una formación de cuatro jugadores de campo y un portero", () => {
  const players = [
    { id: "gk", clubId: "a", positionGroup: "GK", status: "active" },
    { id: "f1", clubId: "a", positionGroup: "FIELD", status: "active" },
    { id: "f2", clubId: "a", positionGroup: "FIELD", status: "active" },
    { id: "f3", clubId: "a", positionGroup: "FIELD", status: "active" },
    { id: "f4", clubId: "a", positionGroup: "FIELD", status: "active" },
  ];
  const matchdays = [{ matches: [{ id: "match", homeClubId: "a", awayClubId: "b" }] }];
  assert.equal(validateLineup({ players, clubId: "a", matchId: "match", matchdays }), null);
  assert.match(validateLineup({ players: players.slice(1), clubId: "a", matchId: "match", matchdays }), /exactamente cuatro jugadores/i);
});

test("convierte eventos oficiales en líderes individuales", () => {
  const players = [
    { id: "p1", name: "Alex", clubId: "a" },
    { id: "p2", name: "Bruno", clubId: "b" },
  ];
  const rows = calculatePlayerStatistics(players, [
    { eventType: "goal", playerId: "p1" },
    { eventType: "goal", playerId: "p1" },
    { eventType: "assist", playerId: "p2" },
    { eventType: "mvp", playerId: "p1" },
  ]);
  const scorers = getStatisticLeaders(rows, "goals");
  assert.equal(scorers[0].player.name, "Alex");
  assert.equal(scorers[0].goals, 2);
  assert.equal(getStatisticLeaders(rows, "assists")[0].player.name, "Bruno");
});

test("archiva la Elite Cup por grupos y conserva sus eliminatorias", () => {
  const eliteCup = getHistoricCompetitionData("elite-cup");
  const groupA = eliteCup.groups.find((group) => group.id === "group-a");
  const groupB = eliteCup.groups.find((group) => group.id === "group-b");

  assert.equal(eliteCup.regularMatches.length, 30);
  assert.equal(eliteCup.playoffStages.flatMap((stage) => stage.matches).length, 7);
  assert.equal(groupA.regularMatches.length, 15);
  assert.equal(groupB.regularMatches.length, 15);
  const groupAMatchdays = eliteCup.regularMatchdays.map((matchday) => ({
    ...matchday,
    matches: matchday.matches.filter((match) => match.groupId === groupA.id),
  }));
  const groupBMatchdays = eliteCup.regularMatchdays.map((matchday) => ({
    ...matchday,
    matches: matchday.matches.filter((match) => match.groupId === groupB.id),
  }));
  assert.equal(groupAMatchdays.every((matchday) => matchday.matches.length === 3), true);
  assert.equal(groupBMatchdays.every((matchday) => matchday.matches.length === 3), true);
  assert.equal(calculateStandingsThroughMatchday(groupA.clubs, groupAMatchdays, 1).every((row) => row.played === 1), true);
  assert.equal(calculateStandingsThroughMatchday(groupB.clubs, groupBMatchdays, 1).every((row) => row.played === 1), true);
  assert.equal(calculateStandings(groupA.clubs, groupA.regularMatches)[0].club.id, "los-mugiwaras-fc");
  assert.equal(calculateStandings(groupB.clubs, groupB.regularMatches)[0].club.id, "pico-fc");
  assert.deepEqual(eliteCup.playoffStages.at(-1).matches[0].score, { home: 3, away: 4 });
});
