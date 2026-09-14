import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { getPlayerRosterGroup } from "./playerPositions.js";
import { formatPlayerBirthDate, getPlayerCardStatistics, getPlayerDisplayName, getPlayerFullName, getPlayerPositionLabel, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "./playerProfile.js";

// Screenshot fixtures keep editor globals separate from their subattributes.
const fixtures = [{
  slug: "juan-carlos", sourcePlayerId: 280126, firstName: "Juan Carlos", lastName: "Velázquez",
  commonName: "Juan Carlos", jerseyName: "Juan Carlos", birthDate: "1997-02-12",
  formattedBirthDate: "12 de febrero de 1997", preferredFoot: "Izquierda", weakFoot: 4,
  skillMoves: 5, shirtNumber: 8, overall: 86,
  summary: { pace: 84, shooting: 81, passing: 89, dribbling: 86, defending: 79, physical: 87 },
  attributes: {
    acceleration: 86, aggression: 85, agility: 89, balance: 94, ballcontrol: 85,
    composure: 84, crossing: 92, curve: 88, defensiveawareness: 76, dribbling: 84,
    finishing: 83, freekickaccuracy: 85, gkdiving: 6, gkhandling: 10, gkkicking: 9,
    gkpositioning: 12, gkreflexes: 8, headingaccuracy: 80, interceptions: 82,
    jumping: 85, longpassing: 86, longshots: 83, penalties: 79, positioning: 82,
    reactions: 80, shortpassing: 92, shotpower: 80, slidingtackle: 80, sprintspeed: 83,
    stamina: 91, standingtackle: 78, strength: 87, vision: 89, volleys: 78,
  },
}, {
  slug: "guti", sourcePlayerId: 280293, firstName: "José María", lastName: "Gutiérrez Hernández",
  commonName: "Guti", jerseyName: "Guti", birthDate: "1976-10-31",
  formattedBirthDate: "31 de octubre de 1976", preferredFoot: "Derecha", weakFoot: 5,
  skillMoves: 4, shirtNumber: 17, overall: 88, isWildcard: true,
  summary: { pace: 94, shooting: 88, passing: 89, dribbling: 84, defending: 53, physical: 78 },
  attributes: {
    acceleration: 95, aggression: 75, agility: 89, balance: 79, ballcontrol: 96,
    composure: 66, crossing: 84, curve: 92, defensiveawareness: 38, dribbling: 93,
    finishing: 88, freekickaccuracy: 77, gkdiving: 11, gkhandling: 10, gkkicking: 4,
    gkpositioning: 7, gkreflexes: 13, headingaccuracy: 66, interceptions: 75,
    jumping: 65, longpassing: 98, longshots: 92, penalties: 78, positioning: 97,
    reactions: 78, shortpassing: 97, shotpower: 85, slidingtackle: 42, sprintspeed: 94,
    stamina: 78, standingtackle: 45, strength: 95, vision: 84, volleys: 87,
  },
}];

for (const fixture of fixtures) {
  const player = getPlayerProfile(fixture.slug);
  test(`${fixture.commonName} conserva todos los datos públicos de las capturas`, () => {
    const { formattedBirthDate, ...data } = fixture;
    assert.deepEqual(player, {
      ...data, id: `fc25-${fixture.sourcePlayerId}`, game: "FC25", clubId: "pico-fc", editionId: "split-3",
      nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
      portrait: `/players/${fixture.slug}.png`, portraitScale: 1.12,
      positions: ["MC", "MCO"], positionGroup: "MID",
      competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    });
    assert.equal(getPlayerDisplayName(player), fixture.commonName);
    assert.equal(getPlayerFullName(player), `${fixture.firstName} ${fixture.lastName}`);
    assert.equal(formatPlayerBirthDate(player.birthDate), formattedBirthDate);
    assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|skillMovesLikelihood|[a-z]:[\\/]/i);
  });

  test(`${fixture.commonName} tiene sus 34 atributos y seis globales independientes`, () => {
    const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
    assert.equal(keys.length, 34);
    assert.equal(new Set(keys).size, 34);
    assert.deepEqual([...keys].sort(), Object.keys(fixture.attributes).sort());
    assert.deepEqual(player.attributes, fixture.attributes);
    assert.deepEqual(getPlayerSummary(player).map(({ value }) => value), Object.values(fixture.summary));
    assert.notEqual(player.summary.dribbling, player.attributes.dribbling);
  });

  test(`${fixture.commonName} es MC y MCO, una sola vez entre los centrocampistas de Pico FC`, () => {
    assert.equal(getPlayerRosterGroup(player), "MID");
    assert.equal(getPlayerPositionLabel(player), "MC · MCO");
    assert.equal(getClubPlayerProfiles("pico-fc").filter(({ slug }) => slug === fixture.slug).length, 1);
    for (const editionId of ["split-1", "split-2", "elite-cup", "split-4"]) {
      assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
    }
    assert.ok(!getClubPlayerProfiles("bee-fc").includes(player));
    assert.deepEqual(getPlayerCardStatistics(player).map(({ label, value }) => [label, value]), [
      ["Partidos", 0], ["Goles", 0], ["Amarillas", 0], ["Azules", 0],
    ]);
  });

  test(`${fixture.commonName} tiene su miniface PNG RGBA de 1254 px y bandera`, () => {
    const portrait = readFileSync(new URL(`../../public${player.portrait}`, import.meta.url));
    assert.deepEqual(portrait.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    assert.equal(portrait.readUInt32BE(16), 1254);
    assert.equal(portrait.readUInt32BE(20), 1254);
    assert.equal(portrait[25], 6);
    const flag = readFileSync(new URL(`../../public${player.nationalityFlag}`, import.meta.url));
    assert.deepEqual(flag.subarray(0, 8), portrait.subarray(0, 8));
  });
}
