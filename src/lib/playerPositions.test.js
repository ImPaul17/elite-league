import test from "node:test";
import assert from "node:assert/strict";
import { PLAYER_ROSTER_GROUPS, getPlayerPositions, getPlayerRosterGroup } from "./playerPositions.js";

const mappings = [
  ["GK", "POR", "GK"],
  ...["CB", "LCB", "RCB", "SW"].map((position) => [position, "DFC", "DEF"]),
  ["LB", "LI", "DEF"], ["RB", "LD", "DEF"], ["LWB", "CAI", "DEF"], ["RWB", "CAD", "DEF"],
  ...["CDM", "LDM", "RDM"].map((position) => [position, "MCD", "MID"]),
  ...["CM", "LCM", "RCM"].map((position) => [position, "MC", "MID"]),
  ["LM", "MI", "MID"], ["RM", "MD", "MID"],
  ...["CAM", "LAM", "RAM"].map((position) => [position, "MCO", "MID"]),
  ...["CF", "SS"].map((position) => [position, "SD", "FWD"]),
  ...["ST", "LS", "RS"].map((position) => [position, "DC", "FWD"]),
  ["LW", "EI", "FWD"], ["RW", "ED", "FWD"],
];

test("squad lines follow the requested Spanish heading order", () => {
  assert.deepEqual(PLAYER_ROSTER_GROUPS, [
    { id: "GK", label: "Porteros" },
    { id: "DEF", label: "Defensas" },
    { id: "MID", label: "Centrocampistas" },
    { id: "FWD", label: "Delanteros" },
  ]);
});

test("every FIFA English abbreviation normalizes and groups into the requested line", () => {
  for (const [position, abbreviation, group] of mappings) {
    assert.deepEqual(getPlayerPositions({ positions: [position] }), [abbreviation], position);
    assert.equal(getPlayerRosterGroup({ positions: [position] }), group, position);
    assert.deepEqual(getPlayerPositions({ positions: [abbreviation] }), [abbreviation], abbreviation);
    assert.equal(getPlayerRosterGroup({ positions: [abbreviation] }), group, abbreviation);
  }
});

test("English full names and Spanish names support whitespace, accents and hyphen variants", () => {
  const names = [
    ["Goalkeeper", "POR", "GK"], ["Center Back", "DFC", "DEF"], ["Centre Back", "DFC", "DEF"],
    ["Left Back", "LI", "DEF"], ["Right Back", "LD", "DEF"],
    ["Left Wing-Back", "CAI", "DEF"], ["Right Wing Back", "CAD", "DEF"],
    ["Defensive Midfielder", "MCD", "MID"], ["Central Midfielder", "MC", "MID"],
    ["Left Midfielder", "MI", "MID"], ["Right Midfielder", "MD", "MID"],
    ["Attacking Midfielder", "MCO", "MID"], ["Centre Forward", "SD", "FWD"],
    ["Second Striker", "SD", "FWD"], ["Striker", "DC", "FWD"],
    ["Left Winger", "EI", "FWD"], ["Right Wing", "ED", "FWD"],
    ["  defensa central  ", "DFC", "DEF"], ["Líbero", "DFC", "DEF"],
    ["mediocentro defensivo", "MCD", "MID"], ["Mediapunta", "MCO", "MID"],
    ["Segundo delantero", "SD", "FWD"], ["extremo derecho", "ED", "FWD"],
  ];
  for (const [position, abbreviation, group] of names) {
    assert.deepEqual(getPlayerPositions({ position }), [abbreviation], position);
    assert.equal(getPlayerRosterGroup({ position }), group, position);
  }
});

test("multi-position players retain preference order without duplicate aliases or squad entries", () => {
  const player = { positions: ["LM", "MI", "LW", "EI", "CM"], positionGroup: "FWD" };
  assert.deepEqual(getPlayerPositions(player), ["MI", "EI", "MC"]);
  assert.equal(getPlayerRosterGroup(player), "MID");
  assert.equal(getPlayerRosterGroup({ positions: ["LW", "LM"] }), "FWD");
  assert.equal(getPlayerRosterGroup({ positions: ["CB", "GK"] }), "DEF");
  assert.equal(getPlayerRosterGroup({ positions: ["GK", "CB"] }), "GK");
  assert.deepEqual(getPlayerPositions({ positions: "CB / RB; DFC, LB · None" }), ["DFC", "LD", "LI"]);
});

test("a singular position is used when positions is missing or empty", () => {
  for (const positions of [undefined, null, [], ["", "None", null]]) {
    const player = { positions, position: "Center Back", positionGroup: "MID" };
    assert.deepEqual(getPlayerPositions(player), ["DFC"]);
    assert.equal(getPlayerRosterGroup(player), "DEF");
  }
});

test("broad groups are fallback only when no primary position exists", () => {
  for (const group of ["GK", "DEF", "MID", "FWD"]) {
    assert.equal(getPlayerRosterGroup({ positionGroup: group }), group);
    assert.equal(getPlayerRosterGroup({ positions: ["None"], positionGroup: group }), group);
    assert.equal(getPlayerRosterGroup({ positions: ["N/A"], positionGroup: group }), group);
    assert.deepEqual(getPlayerPositions({ positionGroup: group }), []);
  }
  assert.equal(getPlayerRosterGroup({ positionGroup: "Portero" }), "GK");
  assert.equal(getPlayerRosterGroup({ positionGroup: "Defensa" }), "DEF");
});

test("missing or unknown positions are not invented or silently classified using a secondary position", () => {
  for (const player of [undefined, null, {}, { positions: [null, 0, "None", "N/A"] }, { positionGroup: "Other" }]) {
    assert.deepEqual(getPlayerPositions(player), []);
    assert.equal(getPlayerRosterGroup(player), null);
  }
  const player = { positions: ["Unknown role", "CB"], positionGroup: "DEF" };
  assert.deepEqual(getPlayerPositions(player), ["DFC"]);
  assert.equal(getPlayerRosterGroup(player), null);
  assert.equal(getPlayerRosterGroup({ position: "Unknown role", positionGroup: "DEF" }), null);
});
