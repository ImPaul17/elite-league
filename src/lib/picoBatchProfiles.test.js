import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { transformWithEsbuild } from "vite";
import { getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { CLUBS } from "../data/league.js";
import { getClubProfile, getCompetitionEdition } from "../data/history.js";
import { getRouteParts } from "../app/routes.js";
import { readClubWorkspaceRoute } from "./clubWorkspace.js";
import { getPlayerPositions, getPlayerRosterGroup } from "./playerPositions.js";
import { getPlayerCardStatistics, getPlayerDisplayName, getPlayerFullName, getPlayerPositionLabel, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "./playerProfile.js";

// Independently transcribed from the supplied FC25 editor screenshots.
// Use Skill Moves itself, not Skill Moves Likelihood; do not recalculate FUT stats.
const screenshotPlayers = [
  {
    sourcePlayerId: 280102, slug: "joan", firstName: "Joan", lastName: "Galarreta",
    commonName: "Joan", jerseyName: "Joan", birthDate: "1997-07-17",
    preferredFoot: "Derecha", weakFoot: 5, skillMoves: 4, positions: ["DC"],
    positionGroup: "FWD", shirtNumber: 7, overall: 84,
    summary: { pace: 84, shooting: 85, passing: 86, dribbling: 86, defending: 39, physical: 64 },
    attributes: {
      acceleration: 85, aggression: 72, agility: 90, balance: 90, ballcontrol: 84,
      composure: 84, crossing: 95, curve: 88, defensiveawareness: 41, dribbling: 87,
      finishing: 85, freekickaccuracy: 83, gkdiving: 5, gkhandling: 10, gkkicking: 13,
      gkpositioning: 6, gkreflexes: 6, headingaccuracy: 80, interceptions: 31,
      jumping: 32, longpassing: 77, longshots: 83, penalties: 87, positioning: 84,
      reactions: 81, shortpassing: 93, shotpower: 82, slidingtackle: 20, sprintspeed: 82,
      stamina: 80, standingtackle: 22, strength: 72, vision: 81, volleys: 90,
    },
  },
  {
    sourcePlayerId: 280150, slug: "kike", firstName: "Enrique", lastName: "Villalba",
    commonName: "Kike", jerseyName: "Kike", birthDate: "1989-07-26",
    preferredFoot: "Izquierda", weakFoot: 3, skillMoves: 2, positions: ["LI"],
    positionGroup: "DEF", shirtNumber: 2, overall: 84,
    summary: { pace: 88, shooting: 64, passing: 80, dribbling: 86, defending: 81, physical: 86 },
    attributes: {
      acceleration: 87, aggression: 90, agility: 93, balance: 82, ballcontrol: 89,
      composure: 84, crossing: 79, curve: 73, defensiveawareness: 83, dribbling: 82,
      finishing: 58, freekickaccuracy: 66, gkdiving: 10, gkhandling: 10, gkkicking: 10,
      gkpositioning: 10, gkreflexes: 10, headingaccuracy: 70, interceptions: 90,
      jumping: 80, longpassing: 93, longshots: 60, penalties: 78, positioning: 75,
      reactions: 83, shortpassing: 84, shotpower: 67, slidingtackle: 81, sprintspeed: 89,
      stamina: 84, standingtackle: 82, strength: 92, vision: 84, volleys: 48,
    },
  },
  {
    sourcePlayerId: 280197, slug: "carlos-castro", firstName: "Carlos", lastName: "Castro",
    commonName: "", jerseyName: "C. Castro", birthDate: "2001-07-05",
    preferredFoot: "Derecha", weakFoot: 4, skillMoves: 4, positions: ["MC"],
    positionGroup: "MID", shirtNumber: 13, overall: 84,
    summary: { pace: 80, shooting: 85, passing: 89, dribbling: 87, defending: 63, physical: 80 },
    attributes: {
      acceleration: 84, aggression: 80, agility: 92, balance: 90, ballcontrol: 88,
      composure: 87, crossing: 87, curve: 95, defensiveawareness: 67, dribbling: 88,
      finishing: 89, freekickaccuracy: 91, gkdiving: 12, gkhandling: 9, gkkicking: 14,
      gkpositioning: 6, gkreflexes: 11, headingaccuracy: 80, interceptions: 76,
      jumping: 78, longpassing: 83, longshots: 86, penalties: 74, positioning: 81,
      reactions: 79, shortpassing: 93, shotpower: 90, slidingtackle: 46, sprintspeed: 77,
      stamina: 80, standingtackle: 48, strength: 84, vision: 84, volleys: 90,
    },
  },
  {
    sourcePlayerId: 280221, slug: "carlos-pelaz", firstName: "Carlos", lastName: "Pelaz",
    commonName: "", jerseyName: "C. Pelaz", birthDate: "1997-11-10",
    preferredFoot: "Izquierda", weakFoot: 5, skillMoves: 5, positions: ["DC"],
    positionGroup: "FWD", shirtNumber: 12, overall: 84,
    summary: { pace: 87, shooting: 82, passing: 81, dribbling: 86, defending: 30, physical: 78 },
    attributes: {
      acceleration: 88, aggression: 56, agility: 94, balance: 80, ballcontrol: 94,
      composure: 73, crossing: 75, curve: 85, defensiveawareness: 13, dribbling: 95,
      finishing: 88, freekickaccuracy: 84, gkdiving: 11, gkhandling: 9, gkkicking: 10,
      gkpositioning: 7, gkreflexes: 10, headingaccuracy: 80, interceptions: 33,
      jumping: 83, longpassing: 74, longshots: 67, penalties: 90, positioning: 85,
      reactions: 78, shortpassing: 80, shotpower: 76, slidingtackle: 11, sprintspeed: 86,
      stamina: 89, standingtackle: 14, strength: 84, vision: 88, volleys: 83,
    },
  },
  {
    sourcePlayerId: 280245, slug: "bruno-zapata", firstName: "Bruno", lastName: "Zapata",
    commonName: "", jerseyName: "Zapata", birthDate: "1994-09-07",
    preferredFoot: "Izquierda", weakFoot: 5, skillMoves: 4, positions: ["MD"],
    positionGroup: "MID", shirtNumber: 15, overall: 85,
    summary: { pace: 87, shooting: 87, passing: 82, dribbling: 89, defending: 51, physical: 84 },
    attributes: {
      acceleration: 90, aggression: 82, agility: 90, balance: 90, ballcontrol: 92,
      composure: 90, crossing: 71, curve: 91, defensiveawareness: 34, dribbling: 90,
      finishing: 90, freekickaccuracy: 89, gkdiving: 10, gkhandling: 11, gkkicking: 7,
      gkpositioning: 6, gkreflexes: 8, headingaccuracy: 85, interceptions: 52,
      jumping: 89, longpassing: 76, longshots: 83, penalties: 88, positioning: 89,
      reactions: 83, shortpassing: 85, shotpower: 86, slidingtackle: 37, sprintspeed: 84,
      stamina: 85, standingtackle: 45, strength: 81, vision: 83, volleys: 84,
    },
  },
];

const summaryLabels = ["Ritmo", "Tiro", "Pase", "Regate", "Defensa", "Físico"];
const summaryKeys = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];

for (const fixture of screenshotPlayers) {
  const displayName = fixture.commonName || `${fixture.firstName} ${fixture.lastName}`;

  test(`${displayName}: identidad, dorsal y estadísticas exactas de las capturas`, () => {
    const player = getPlayerProfile(fixture.slug);
    assert.deepEqual(player, {
      ...fixture,
      id: `fc25-${fixture.sourcePlayerId}`, game: "FC25", clubId: "pico-fc", editionId: "split-3",
      nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
      portrait: `/players/${fixture.slug}.png`, portraitScale: 1.12,
      competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    });
    assert.equal(getPlayerDisplayName(player), displayName);
    assert.equal(getPlayerFullName(player), `${fixture.firstName} ${fixture.lastName}`);
    assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
  });

  test(`${displayName}: miniface y bandera disponibles como PNG públicos`, () => {
    const player = getPlayerProfile(fixture.slug);
    assert.ok(player, `Falta el perfil ${fixture.slug}`);
    for (const path of [player.portrait, player.nationalityFlag]) {
      const assetUrl = new URL(`../../public${path}`, import.meta.url);
      assert.ok(existsSync(assetUrl), `El recurso ${path} debe estar disponible en public`);
      assert.deepEqual(readFileSync(assetUrl).subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
  });

  test(`${displayName}: los 34 atributos tienen valor exacto y etiqueta en la ficha`, () => {
    const player = getPlayerProfile(fixture.slug);
    assert.ok(player, `Falta el perfil ${fixture.slug}`);
    const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
    assert.equal(keys.length, 34);
    assert.equal(new Set(keys).size, 34);
    assert.deepEqual([...keys].sort(), Object.keys(fixture.attributes).sort());
    assert.deepEqual(player.attributes, fixture.attributes);
  });

  test(`${displayName}: seis globales confirmados y cuatro contadores a cero`, () => {
    const player = getPlayerProfile(fixture.slug);
    assert.ok(player, `Falta el perfil ${fixture.slug}`);
    assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]),
      summaryKeys.map((key, index) => [summaryLabels[index], fixture.summary[key]]));
    assert.deepEqual(getPlayerCardStatistics(player), [
      { id: "appearances", label: "Partidos", value: 0 },
      { id: "goals", label: "Goles", value: 0 },
      { id: "yellowCards", label: "Amarillas", value: 0 },
      { id: "blueCards", label: "Azules", value: 0 },
    ]);
  });

  test(`${displayName}: posición FIFA española y grupo correctos, solo Pico FC Split 3`, () => {
    const player = getPlayerProfile(fixture.slug);
    assert.ok(player, `Falta el perfil ${fixture.slug}`);
    assert.equal(getPlayerRosterGroup(player), fixture.positionGroup);
    assert.deepEqual(getPlayerPositions(player), fixture.positions);
    assert.equal(getPlayerPositionLabel(player), fixture.positions[0]);
    assert.ok(getClubPlayerProfiles("pico-fc").includes(player));
    for (const editionId of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
      assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
    }
    for (const clubId of ["club-12", "bee-fc", "", null]) {
      assert.ok(!getClubPlayerProfiles(clubId).includes(player));
    }
  });
}

test("las cinco rutas abren su ficha de Pico FC y rechazan segmentos adicionales", async () => {
  const app = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("function RouteView("), app.indexOf("function NotFoundPage("));
  const { code } = await transformWithEsbuild(source, "RouteView.jsx", { loader: "jsx", jsxFactory: "element", jsxFragment: "Fragment" });
  const element = (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) });
  const bindings = {
    useLeague: () => ({ league: { clubs: CLUBS }, viewer: null }),
    getRouteParts, readClubWorkspaceRoute, getPlayerProfile, getClubProfile, getCompetitionEdition,
    PlayerPage: "PlayerPage", NotFoundPage: "NotFoundPage",
  };
  const RouteView = new Function("element", ...Object.keys(bindings), `${code}\nreturn RouteView;`)(element, ...Object.values(bindings));
  for (const fixture of screenshotPlayers) {
    const player = getPlayerProfile(fixture.slug);
    assert.ok(player, `Falta el perfil ${fixture.slug}`);
    const route = RouteView({ path: `/jugadores/${fixture.slug}` });
    assert.equal(route.type, "PlayerPage");
    assert.equal(route.props.player, player);
    assert.equal(route.props.club.id, "pico-fc");
    assert.equal(RouteView({ path: `/jugadores/${fixture.slug}/extra` }).type, "NotFoundPage");
  }
});
