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

const player = getPlayerProfile("fran-rios");

// Portable fixture transcribed from the league's FC25 editor screenshots.
// The Pico FC export only confirms membership and shirt number.
const screenshotAttributes = {
  acceleration: 59, aggression: 87, agility: 74, balance: 84, ballcontrol: 82,
  composure: 86, crossing: 74, curve: 80, defensiveawareness: 81, dribbling: 67,
  finishing: 73, freekickaccuracy: 73, gkdiving: 16, gkhandling: 7, gkkicking: 16,
  gkpositioning: 7, gkreflexes: 10, headingaccuracy: 81, interceptions: 86,
  jumping: 90, longpassing: 83, longshots: 80, penalties: 81, positioning: 78,
  reactions: 79, shortpassing: 83, shotpower: 73, slidingtackle: 83, sprintspeed: 68,
  stamina: 89, standingtackle: 84, strength: 88, vision: 74, volleys: 74,
};

test("Fran Ríos conserva los datos públicos de las capturas y el dorsal 6 confirmado", () => {
  assert.deepEqual(player, {
    id: "fc25-280078", slug: "fran-rios", sourcePlayerId: 280078, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Fran", lastName: "Ríos",
    commonName: "Fran Ríos", jerseyName: "Fran Ríos", birthDate: "1989-01-13",
    nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
    portrait: "/players/fran-rios.png", portraitScale: 1.12, preferredFoot: "Izquierda", weakFoot: 3,
    skillMoves: 2, positions: ["MCD"], positionGroup: "MID", shirtNumber: 6, overall: 83,
    summary: { pace: 64, shooting: 76, passing: 78, dribbling: 79, defending: 83, physical: 88 },
    competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    attributes: screenshotAttributes,
  });
  assert.equal(getPlayerDisplayName(player), "Fran Ríos");
  assert.equal(getPlayerFullName(player), "Fran Ríos");
  assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
});

test("la miniface y bandera de Fran existen en public como PNG", () => {
  for (const path of [player.portrait, player.nationalityFlag]) {
    const assetUrl = new URL(`../../public${path}`, import.meta.url);
    assert.ok(existsSync(assetUrl), `El recurso ${path} debe estar disponible en public`);
    assert.deepEqual(readFileSync(assetUrl).subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
});

test("los 34 atributos de Fran coinciden con las capturas y tienen etiqueta en la ficha", () => {
  const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
  assert.equal(keys.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(screenshotAttributes).sort());
  assert.deepEqual(player.attributes, screenshotAttributes);
});

test("los seis globales y contadores de Fran usan los valores confirmados", () => {
  assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]), [
    ["Ritmo", 64], ["Tiro", 76], ["Pase", 78], ["Regate", 79], ["Defensa", 83], ["Físico", 88],
  ]);
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goals", label: "Goles", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
});

test("Fran aparece como centrocampista MCD solo en la plantilla de Pico FC Split 3", () => {
  assert.equal(getPlayerRosterGroup(player), "MID");
  assert.deepEqual(getPlayerPositions(player), ["MCD"]);
  assert.equal(getPlayerPositionLabel(player), "MCD");
  assert.ok(getClubPlayerProfiles("pico-fc").includes(player));
  for (const editionId of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
    assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
  }
  for (const clubId of ["club-12", "bee-fc", "", null]) {
    assert.ok(!getClubPlayerProfiles(clubId).includes(player));
  }
});

test("la ruta de Fran abre su ficha real de Pico FC y rechaza segmentos adicionales", async () => {
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
  const route = RouteView({ path: "/jugadores/fran-rios" });
  assert.equal(route.type, "PlayerPage");
  assert.equal(route.props.player, player);
  assert.equal(route.props.club.id, "pico-fc");
  assert.equal(RouteView({ path: "/jugadores/fran-rios/extra" }).type, "NotFoundPage");
});
