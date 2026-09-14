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

const player = getPlayerProfile("samuel-jimenez");

// Portable fixture transcribed from the league's FC25 editor screenshots.
// The Pico FC export only confirms membership and shirt number.
const screenshotAttributes = {
  acceleration: 79, aggression: 95, agility: 84, balance: 86, ballcontrol: 86,
  composure: 80, crossing: 75, curve: 63, defensiveawareness: 86, dribbling: 80,
  finishing: 78, freekickaccuracy: 48, gkdiving: 15, gkhandling: 8, gkkicking: 12,
  gkpositioning: 15, gkreflexes: 12, headingaccuracy: 80, interceptions: 93,
  jumping: 95, longpassing: 84, longshots: 70, penalties: 80, positioning: 83,
  reactions: 86, shortpassing: 75, shotpower: 73, slidingtackle: 87, sprintspeed: 88,
  stamina: 89, standingtackle: 91, strength: 97, vision: 82, volleys: 62,
};

test("Samuel Jiménez conserva los datos públicos de las capturas y el dorsal 4 confirmado", () => {
  assert.deepEqual(player, {
    id: "fc25-280054", slug: "samuel-jimenez", sourcePlayerId: 280054, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Samuel", lastName: "Jiménez",
    commonName: "", jerseyName: "Samu", birthDate: "1999-09-12",
    nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
    portrait: "/players/samuel-jimenez.png", portraitScale: 1.12, preferredFoot: "Izquierda", weakFoot: 4,
    skillMoves: 3, positions: ["LD"], positionGroup: "DEF", shirtNumber: 4, overall: 86,
    summary: { pace: 84, shooting: 74, passing: 71, dribbling: 84, defending: 87, physical: 94 },
    competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    attributes: screenshotAttributes,
  });
  assert.equal(getPlayerDisplayName(player), "Samuel Jiménez");
  assert.equal(getPlayerFullName(player), "Samuel Jiménez");
  assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
});

test("la miniface y bandera de Samuel existen en public como PNG", () => {
  for (const path of [player.portrait, player.nationalityFlag]) {
    const assetUrl = new URL(`../../public${path}`, import.meta.url);
    assert.ok(existsSync(assetUrl), `El recurso ${path} debe estar disponible en public`);
    assert.deepEqual(readFileSync(assetUrl).subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
});

test("los 34 atributos de Samuel coinciden con las capturas y tienen etiqueta en la ficha", () => {
  const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
  assert.equal(keys.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(screenshotAttributes).sort());
  assert.deepEqual(player.attributes, screenshotAttributes);
});

test("los seis globales y contadores de Samuel usan los valores confirmados", () => {
  assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]), [
    ["Ritmo", 84], ["Tiro", 74], ["Pase", 71], ["Regate", 84], ["Defensa", 87], ["Físico", 94],
  ]);
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goals", label: "Goles", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
});

test("Samuel aparece como defensa LD solo en la plantilla de Pico FC Split 3", () => {
  assert.equal(getPlayerRosterGroup(player), "DEF");
  assert.deepEqual(getPlayerPositions(player), ["LD"]);
  assert.equal(getPlayerPositionLabel(player), "LD");
  assert.ok(getClubPlayerProfiles("pico-fc").includes(player));
  for (const editionId of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
    assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
  }
  for (const clubId of ["club-12", "bee-fc", "", null]) {
    assert.ok(!getClubPlayerProfiles(clubId).includes(player));
  }
});

test("la ruta de Samuel abre su ficha real de Pico FC y rechaza segmentos adicionales", async () => {
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
  const route = RouteView({ path: "/jugadores/samuel-jimenez" });
  assert.equal(route.type, "PlayerPage");
  assert.equal(route.props.player, player);
  assert.equal(route.props.club.id, "pico-fc");
  assert.equal(RouteView({ path: "/jugadores/samuel-jimenez/extra" }).type, "NotFoundPage");
});
