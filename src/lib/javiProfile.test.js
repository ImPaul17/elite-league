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

const player = getPlayerProfile("javi-diop");

// Portable fixture transcribed from the league's FC25 editor screenshots.
// The Pico FC export only confirms membership and shirt number.
const screenshotAttributes = {
  acceleration: 83, aggression: 82, agility: 73, balance: 68, ballcontrol: 76,
  composure: 71, crossing: 78, curve: 54, defensiveawareness: 82, dribbling: 73,
  finishing: 60, freekickaccuracy: 42, gkdiving: 9, gkhandling: 10, gkkicking: 13,
  gkpositioning: 11, gkreflexes: 11, headingaccuracy: 77, interceptions: 79,
  jumping: 92, longpassing: 73, longshots: 49, penalties: 48, positioning: 63,
  reactions: 71, shortpassing: 79, shotpower: 61, slidingtackle: 90, sprintspeed: 82,
  stamina: 94, standingtackle: 88, strength: 93, vision: 64, volleys: 52,
};

test("Javi Diop conserva los datos públicos de las capturas y el dorsal 3 confirmado", () => {
  assert.deepEqual(player, {
    id: "fc25-280030", slug: "javi-diop", sourcePlayerId: 280030, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Javi", lastName: "Diop",
    commonName: "", jerseyName: "Javi", birthDate: "1997-03-12",
    nationality: "Camerún", nationalityCode: "CM", nationalityFlag: "/flags/cm.png",
    portrait: "/players/javi-diop.png", portraitScale: 1.12, preferredFoot: "Izquierda", weakFoot: 3,
    skillMoves: 2, positions: ["LD", "DFC"], positionGroup: "DEF", shirtNumber: 3, overall: 84,
    summary: { pace: 82, shooting: 56, passing: 65, dribbling: 72, defending: 83, physical: 90 },
    competitionStats: { editionId: "split-3", appearances: 0, goals: 0, yellowCards: 0, blueCards: 0 },
    attributes: screenshotAttributes,
  });
  assert.equal(getPlayerDisplayName(player), "Javi Diop");
  assert.equal(getPlayerFullName(player), "Javi Diop");
  assert.doesNotMatch(JSON.stringify(player), /potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
});

test("la miniface y bandera de Javi existen en public como PNG", () => {
  for (const path of [player.portrait, player.nationalityFlag]) {
    const assetUrl = new URL(`../../public${path}`, import.meta.url);
    assert.ok(existsSync(assetUrl), `El recurso ${path} debe estar disponible en public`);
    assert.deepEqual(readFileSync(assetUrl).subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
});

test("los 34 atributos de Javi coinciden con las capturas y tienen etiqueta en la ficha", () => {
  const keys = PLAYER_ATTRIBUTE_GROUPS.flatMap(({ attributes }) => attributes.map(([key]) => key));
  assert.equal(keys.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(screenshotAttributes).sort());
  assert.deepEqual(player.attributes, screenshotAttributes);
});

test("los seis globales y contadores de Javi usan los valores confirmados", () => {
  assert.deepEqual(getPlayerSummary(player).map(({ label, value }) => [label, value]), [
    ["Ritmo", 82], ["Tiro", 56], ["Pase", 65], ["Regate", 72], ["Defensa", 83], ["Físico", 90],
  ]);
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goals", label: "Goles", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
});

test("Javi aparece como defensa LD y DFC solo en la plantilla de Pico FC Split 3", () => {
  assert.equal(getPlayerRosterGroup(player), "DEF");
  assert.deepEqual(getPlayerPositions(player), ["LD", "DFC"]);
  assert.equal(getPlayerPositionLabel(player), "LD · DFC");
  assert.ok(getClubPlayerProfiles("pico-fc").includes(player));
  for (const editionId of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
    assert.ok(!getClubPlayerProfiles("pico-fc", editionId).includes(player));
  }
  for (const clubId of ["club-12", "bee-fc", "", null]) {
    assert.ok(!getClubPlayerProfiles(clubId).includes(player));
  }
});

test("la ruta de Javi abre su ficha real de Pico FC y rechaza segmentos adicionales", async () => {
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
  const route = RouteView({ path: "/jugadores/javi-diop" });
  assert.equal(route.type, "PlayerPage");
  assert.equal(route.props.player, player);
  assert.equal(route.props.club.id, "pico-fc");
  assert.equal(RouteView({ path: "/jugadores/javi-diop/extra" }).type, "NotFoundPage");
});
