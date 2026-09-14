import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { getPlayerCardStatistics, getPlayerDisplayName, getPlayerFullName, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "./playerProfile.js";

const player = getPlayerProfile("raul-miranda");

// Portable fixture transcribed from the supplied FC25 editor screenshots.
// Only the export's confirmed club and shirt number complement those images.
const screenshotAttributes = {
  acceleration: 78, aggression: 81, agility: 74, balance: 71, ballcontrol: 58,
  composure: 76, crossing: 66, curve: 42, defensiveawareness: 91, dribbling: 51,
  finishing: 38, freekickaccuracy: 32, gkdiving: 12, gkhandling: 14, gkkicking: 8,
  gkpositioning: 6, gkreflexes: 12, headingaccuracy: 76, interceptions: 81,
  jumping: 73, longpassing: 59, longshots: 45, penalties: 77, positioning: 54,
  reactions: 90, shortpassing: 73, shotpower: 68, slidingtackle: 94, sprintspeed: 79,
  stamina: 83, standingtackle: 93, strength: 91, vision: 67, volleys: 53,
};

test("Raúl Miranda conserva solo los campos públicos confirmados, sin el nombre antiguo", () => {
  assert.deepEqual(player, {
    id: "fc25-280006", slug: "raul-miranda", sourcePlayerId: 280006, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Raúl", lastName: "Miranda",
    commonName: "", jerseyName: "R. Miranda", birthDate: "1995-03-28",
    nationality: "Portugal", nationalityCode: "PT", nationalityFlag: "/flags/pt.png",
    portrait: "/players/raul-miranda.png", portraitScale: 1.12,
    preferredFoot: "Derecha", weakFoot: 2, skillMoves: 2, positions: ["DFC"],
    positionGroup: "DEF", shirtNumber: 5, overall: 85,
    summary: { pace: 78, shooting: 56, passing: 56, dribbling: 70, defending: 87, physical: 82 },
    competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    attributes: screenshotAttributes,
  });
  assert.equal(getPlayerDisplayName(player), "Raúl Miranda");
  assert.equal(getPlayerFullName(player), "Raúl Miranda");
  assert.equal(getPlayerProfile("roderick-miranda"), null);
  assert.doesNotMatch(JSON.stringify(player), /Roderick|potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
});

test("la miniface de Raúl existe en public y tiene cabecera PNG", () => {
  const portraitUrl = new URL(`../../public${player.portrait}`, import.meta.url);
  assert.ok(existsSync(portraitUrl), "La miniface debe estar disponible en public");
  assert.deepEqual(
    readFileSync(portraitUrl).subarray(0, 8),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
});

test("los 34 atributos de Raúl coinciden con la captura y tienen etiquetas en la ficha", () => {
  const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
  assert.equal(keys.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(screenshotAttributes).sort());
  assert.deepEqual(player.attributes, screenshotAttributes);
});

test("los seis globales de Raúl usan las capturas actuales, no la caché del export", () => {
  assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]), [
    ["Ritmo", 78], ["Tiro", 56], ["Pase", 56], ["Regate", 70], ["Defensa", 87], ["Físico", 82],
  ]);
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goals", label: "Goles", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
});

test("Raúl pertenece a Pico FC Split 3 sin aparecer en otros clubes o ediciones", () => {
  assert.ok(getClubPlayerProfiles("pico-fc").includes(player));
  for (const editionId of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
    assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
  }
  for (const clubId of ["club-12", "bee-fc", "", null]) {
    assert.ok(!getClubPlayerProfiles(clubId).includes(player));
  }
  assert.equal(getPlayerProfile("pol-guillem").summary.speed, 66);
});
