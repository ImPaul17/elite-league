import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { getPlayerRosterGroup } from "./playerPositions.js";
import { formatPlayerBirthDate, getPlayerCardStatistics, getPlayerDisplayName, getPlayerFullName, getPlayerPositionLabel, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "./playerProfile.js";

const player = getPlayerProfile("robert");
// Transcribed from the supplied FC25 editor screenshots, not derived globals.
const screenshotAttributes = {
  acceleration: 96, aggression: 72, agility: 90, balance: 82, ballcontrol: 90,
  composure: 87, crossing: 83, curve: 89, defensiveawareness: 45, dribbling: 89,
  finishing: 86, freekickaccuracy: 81, gkdiving: 11, gkhandling: 8, gkkicking: 10,
  gkpositioning: 7, gkreflexes: 10, headingaccuracy: 73, interceptions: 69,
  jumping: 76, longpassing: 77, longshots: 83, penalties: 79, positioning: 91,
  reactions: 77, shortpassing: 80, shotpower: 83, slidingtackle: 45, sprintspeed: 84,
  stamina: 63, standingtackle: 41, strength: 76, vision: 90, volleys: 84,
};

test("Robert conserva identidad, dorsal 16 y los datos públicos de las capturas", () => {
  assert.deepEqual(player, {
    id: "fc25-280269", slug: "robert", sourcePlayerId: 280269, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Roberto", lastName: "White",
    commonName: "Robert", jerseyName: "Robert", birthDate: "1992-03-08",
    nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
    portrait: "/players/robert.png", portraitScale: 1.12, preferredFoot: "Izquierda",
    weakFoot: 4, skillMoves: 5, positions: ["MD"], positionGroup: "MID", shirtNumber: 16,
    overall: 85,
    summary: { pace: 90, shooting: 84, passing: 83, dribbling: 86, defending: 55, physical: 72 },
    competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    attributes: screenshotAttributes,
  });
  assert.equal(getPlayerDisplayName(player), "Robert");
  assert.equal(getPlayerFullName(player), "Roberto White");
  assert.equal(formatPlayerBirthDate(player.birthDate), "8 de marzo de 1992");
  assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|skillMovesLikelihood|[a-z]:[\\/]/i);
});

test("Robert tiene los 34 atributos etiquetados, sin confundir el regate global con Regates", () => {
  const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
  assert.equal(keys.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(screenshotAttributes).sort());
  assert.deepEqual(player.attributes, screenshotAttributes);
  assert.equal(player.summary.dribbling, 86);
  assert.equal(player.attributes.dribbling, 89);
});

test("Robert conserva seis globales y contadores iniciales del Split 3", () => {
  assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]), [
    ["Ritmo", 90], ["Tiro", 84], ["Pase", 83], ["Regate", 86], ["Defensa", 55], ["Físico", 72],
  ]);
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goals", label: "Goles", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
});

test("Robert es MD entre los centrocampistas de Pico FC y no aparece en otros splits", () => {
  assert.equal(getPlayerRosterGroup(player), "MID");
  assert.equal(getPlayerPositionLabel(player), "MD");
  assert.equal(getClubPlayerProfiles("pico-fc").filter(({ slug }) => slug === "robert").length, 1);
  for (const editionId of ["split-1", "split-2", "elite-cup", "split-4"]) {
    assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
  }
  assert.ok(!getClubPlayerProfiles("bee-fc").includes(player));
});

test("la miniface de Robert está disponible en PNG RGBA de 1254 px", () => {
  const portrait = readFileSync(new URL(`../../public${player.portrait}`, import.meta.url));
  assert.deepEqual(portrait.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  assert.equal(portrait.readUInt32BE(16), 1254);
  assert.equal(portrait.readUInt32BE(20), 1254);
  assert.equal(portrait[25], 6);
  const flag = readFileSync(new URL(`../../public${player.nationalityFlag}`, import.meta.url));
  assert.deepEqual(flag.subarray(0, 8), portrait.subarray(0, 8));
});
