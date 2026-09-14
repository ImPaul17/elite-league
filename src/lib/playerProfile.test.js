import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transformWithEsbuild } from "vite";
import { PLAYER_PROFILES, getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { CLUBS } from "../data/league.js";
import { getClubProfile, getCompetitionEdition } from "../data/history.js";
import { getRouteParts } from "../app/routes.js";
import { readClubWorkspaceRoute } from "./clubWorkspace.js";
import { PLAYER_FEATURES_ENABLED } from "./releaseFeatures.js";
import { getPlayerRosterGroup, PLAYER_ROSTER_GROUPS } from "./playerPositions.js";
import { formatPlayerBirthDate, getPlayerCardStatistics, getPlayerDisplayName, getPlayerFullName, getPlayerPositionLabel, getPlayerSummary, PLAYER_ATTRIBUTE_GROUPS } from "./playerProfile.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const player = getPlayerProfile("pol-guillem");

// Independently checked against the supplied FC25 player 279982 export.
// Keep this portable fixture limited to the requested public fields; the raw
// export and its local directory are deliberately not required or published.
const sourceAttributes = {
  acceleration: 66, aggression: 18, agility: 38, balance: 42, ballcontrol: 18,
  composure: 58, crossing: 20, curve: 20, defensiveawareness: 16, dribbling: 19,
  finishing: 19, freekickaccuracy: 18, gkdiving: 88, gkhandling: 85, gkkicking: 87,
  gkpositioning: 84, gkreflexes: 88, headingaccuracy: 19, interceptions: 25,
  jumping: 57, longpassing: 25, longshots: 18, penalties: 27, positioning: 20,
  reactions: 78, shortpassing: 32, shotpower: 44, slidingtackle: 19, sprintspeed: 67,
  stamina: 25, standingtackle: 19, strength: 58, vision: 20, volleys: 11,
};

test("el catálogo conserva la ficha de Pol Guillem y una lista cerrada de datos públicos", () => {
  assert.deepEqual(PLAYER_PROFILES.map(({ slug }) => slug), ["pol-guillem", "raul-miranda", "javi-diop", "samuel-jimenez", "fran-rios", "joan", "juan-carlos", "kike", "carlos-castro", "carlos-pelaz", "bruno-zapata", "robert", "guti"]);
  assert.deepEqual(player, {
    id: "fc25-279982", slug: "pol-guillem", sourcePlayerId: 279982, game: "FC25",
    clubId: "pico-fc", editionId: "split-3", firstName: "Pol", lastName: "Guillem",
    commonName: "", jerseyName: "P. Guillem", birthDate: "1996-06-03",
    nationality: "España", nationalityCode: "ES", nationalityFlag: "/flags/es.png",
    portrait: "/players/pol-guillem.png", preferredFoot: "Derecha",
    weakFoot: 2, skillMoves: 1, positions: ["POR"], positionGroup: "GK", shirtNumber: 1,
    overall: 86,
    summary: { speed: 66 },
    competitionStats: { editionId: "split-3", appearances: 0, goalsConceded: 0, yellowCards: 0, blueCards: 0 },
    attributes: sourceAttributes,
  });
  assert.doesNotMatch(JSON.stringify(PLAYER_PROFILES), /potential|appearance\b|headasset|contract|pacdiv|shohan|paskic|driref|defspe|phypos|[a-z]:[\\/]/i);
});

test("la posición de la tarjeta identifica al portero y conserva las posiciones de campo", () => {
  assert.equal(getPlayerPositionLabel(player), "POR");
  for (const goalkeeper of [{ positionGroup: "GK" }, { positionGroup: "POR" }, { positions: ["POR"] }, { positions: ["GK"] }]) {
    assert.equal(getPlayerPositionLabel(goalkeeper), "POR");
  }
  assert.equal(getPlayerPositionLabel({ positionGroup: "DEF", positions: ["DFC", "LD"] }), "DFC · LD");
  for (const missing of [{}, { positions: [] }, { positionGroup: "DEF" }]) {
    assert.equal(getPlayerPositionLabel(missing), "Jugador de campo");
  }
});

test("la tarjeta muestra el registro inicial del Split 3 y los goles encajados del portero", () => {
  assert.deepEqual(getPlayerCardStatistics(player), [
    { id: "appearances", label: "Partidos", value: 0 },
    { id: "goalsConceded", label: "Goles encajados", value: 0 },
    { id: "yellowCards", label: "Amarillas", value: 0 },
    { id: "blueCards", label: "Azules", value: 0 },
  ]);
  const updated = { ...player, competitionStats: { editionId: "split-3", appearances: 2, goalsConceded: 4, yellowCards: 1, blueCards: 0 } };
  assert.deepEqual(getPlayerCardStatistics(updated).map(({ value }) => value), [2, 4, 1, 0]);
  const fieldPlayer = { ...player, positionGroup: "DEF", positions: ["DFC"] };
  assert.deepEqual(getPlayerCardStatistics(fieldPlayer)[1], { id: "goals", label: "Goles", value: null });
  assert.equal(getPlayerCardStatistics({ ...fieldPlayer, competitionStats: { ...fieldPlayer.competitionStats, goals: 3 } })[1].value, 3);
});

test("la tarjeta no inventa ceros ni mezcla registros de otras ediciones", () => {
  for (const competitionStats of [undefined, null, {}, { ...player.competitionStats, editionId: "split-2" }]) {
    assert.ok(getPlayerCardStatistics({ ...player, competitionStats }).every(({ value }) => value === null));
  }
  assert.ok(getPlayerCardStatistics({ ...player, editionId: "split-2" }).every(({ value }) => value === null));
  assert.ok(getPlayerCardStatistics({ positions: ["POR"], competitionStats: { appearances: 2 } }).every(({ value }) => value === null));
  for (const invalid of [undefined, null, -1, 1.5, NaN, Infinity, -Infinity, "2", true]) {
    const competitionStats = { editionId: "split-3", appearances: invalid, goalsConceded: invalid, yellowCards: invalid, blueCards: invalid };
    assert.ok(getPlayerCardStatistics({ ...player, competitionStats }).every(({ value }) => value === null));
  }
});

test("el apodo tiene prioridad, conservando nombre completo, camiseta y fecha de nacimiento", () => {
  assert.equal(getPlayerDisplayName(player), "Pol Guillem");
  assert.equal(getPlayerFullName(player), "Pol Guillem");
  const withNickname = { ...player, commonName: "  Poli  " };
  assert.equal(getPlayerDisplayName(withNickname), "Poli");
  assert.equal(getPlayerFullName(withNickname), "Pol Guillem");
  assert.equal(getPlayerDisplayName({ ...player, commonName: "   " }), "Pol Guillem");
  assert.equal(getPlayerFullName({ firstName: "Pol", lastName: "" }), "Pol");
  assert.equal(formatPlayerBirthDate(player.birthDate), "3 de junio de 1996");
  for (const missing of [undefined, null, "", "invalid"]) assert.equal(formatPlayerBirthDate(missing), "No disponible");
});

test("los 34 atributos reales tienen etiqueta propia, sin omisiones, duplicados ni valores inventados", () => {
  const definitions = PLAYER_ATTRIBUTE_GROUPS.flatMap((group) => group.attributes);
  const keys = definitions.map(([key]) => key);
  const labels = definitions.map(([, label]) => label);
  assert.equal(definitions.length, 34);
  assert.equal(new Set(keys).size, 34);
  assert.equal(new Set(labels).size, 34);
  assert.deepEqual([...keys].sort(), Object.keys(sourceAttributes).sort());
  assert.ok(labels.every((label) => typeof label === "string" && label.trim()));
  assert.equal(new Set(PLAYER_ATTRIBUTE_GROUPS.map((group) => group.id)).size, PLAYER_ATTRIBUTE_GROUPS.length);
  for (const key of keys) assert.equal(player.attributes[key], sourceAttributes[key], key);
});

test("el resumen del portero muestra la velocidad global confirmada sin mezclar aceleración y sprint", () => {
  assert.deepEqual(getPlayerSummary(player), [
    { id: "gkdiving", label: "Estirada", shortLabel: "EST", value: 88 },
    { id: "gkhandling", label: "Parada", shortLabel: "PAR", value: 85 },
    { id: "gkkicking", label: "Chute", shortLabel: "CHU", value: 87 },
    { id: "gkreflexes", label: "Reflejos", shortLabel: "REF", value: 88 },
    { id: "speed", label: "Velocidad", shortLabel: "VEL", value: 66 },
    { id: "gkpositioning", label: "Posición", shortLabel: "POS", value: 84 },
  ]);
  assert.equal(getPlayerSummary({ ...player, summary: { speed: 40 } }).find((stat) => stat.id === "speed").value, 40);
  assert.equal(getPlayerSummary({ ...player, summary: undefined }).find((stat) => stat.id === "speed").value, null);
  assert.doesNotMatch(read("../pages/PlayerPage.jsx"), /Acel\. \/ Sprint|stat\.parts|player-data-note/);
});

test("el resumen de campo ofrece seis categorías y mantiene sin dato los globales desconocidos", () => {
  const fieldPlayer = { ...player, positionGroup: "DEF", positions: ["DFC"], summary: { pace: 70, shooting: 0, physical: 81 } };
  assert.deepEqual(getPlayerSummary(fieldPlayer).map(({ label, value }) => [label, value]), [
    ["Ritmo", 70], ["Tiro", 0], ["Pase", null], ["Regate", null], ["Defensa", null], ["Físico", 81],
  ]);
  assert.ok(getPlayerSummary({ ...fieldPlayer, summary: undefined }).every(({ value }) => value === null));
});

test("la ficha pertenece solo a Pico Split 3, nunca a otros clubes o temporadas", () => {
  assert.deepEqual(getClubPlayerProfiles("pico-fc"), PLAYER_PROFILES);
  assert.deepEqual(getClubPlayerProfiles("pico-fc", "split-3"), PLAYER_PROFILES);
  for (const edition of ["split-1", "split-2", "elite-cup", "split-4", "", null]) {
    assert.deepEqual(getClubPlayerProfiles("pico-fc", edition), []);
  }
  for (const clubId of [...CLUBS.filter((club) => club.id !== "pico-fc").map((club) => club.id), "cegatos-fc", "constructor", "__proto__", "", null]) {
    assert.deepEqual(getClubPlayerProfiles(clubId), []);
  }
  for (const slug of ["paul-guillem", "missing", "constructor", "__proto__", "", null, undefined]) assert.equal(getPlayerProfile(slug), null);
});

const element = (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) });
async function compileComponent(source, name, bindings) {
  const { code } = await transformWithEsbuild(source, `${name}.jsx`, { loader: "jsx", jsxFactory: "element", jsxFragment: "Fragment" });
  return new Function("element", ...Object.keys(bindings), `${code}\nreturn ${name};`)(element, ...Object.values(bindings));
}

test("la ruta real abre la ficha válida y devuelve 404 para slug inexistente o segmentos extra", async () => {
  const app = read("../App.jsx");
  const source = app.slice(app.indexOf("function RouteView("), app.indexOf("function NotFoundPage("));
  assert.ok(source.includes("PlayerPage"));
  const RouteView = await compileComponent(source, "RouteView", {
    useLeague: () => ({ league: { clubs: CLUBS }, viewer: null }),
    getRouteParts, readClubWorkspaceRoute, getPlayerProfile, getClubProfile, getCompetitionEdition,
    PlayerPage: "PlayerPage", NotFoundPage: "NotFoundPage",
  });
  const valid = RouteView({ path: "/jugadores/pol-guillem" });
  assert.equal(valid.type, "PlayerPage");
  assert.equal(valid.props.player, player);
  assert.equal(valid.props.club.id, "pico-fc");
  for (const path of ["/jugadores/no-existe", "/jugadores", "/jugadores/pol-guillem/extra"]) {
    assert.equal(RouteView({ path }).type, "NotFoundPage", path);
  }
});

test("la plantilla real no filtra el piloto ni las inscripciones actuales hacia splits antiguos", async () => {
  const source = read("../components/ClubRoster.jsx").replace(/^import .+;\r?\n/gm, "").replace("export function ClubRoster", "function ClubRoster");
  const ClubRoster = await compileComponent(source, "ClubRoster", {
    getClubPlayerProfiles, getPlayerDisplayName, getPlayerPositionLabel, getPlayerRosterGroup, PLAYER_ROSTER_GROUPS,
    AppLink: "AppLink", EmptyState: "EmptyState", PlayerCard: "PlayerCard", FlagAttribution: "FlagAttribution",
  });
  const club = CLUBS.find((item) => item.id === "pico-fc");
  const current = ClubRoster({ club });
  assert.equal(current.type, "div");
  assert.match(JSON.stringify(current), /\/jugadores\/pol-guillem/);
  for (const editionId of ["split-1", "split-2", "elite-cup"]) {
    const historic = ClubRoster({ club, editionId, players: [{ id: "registration-example", name: "Current registration" }] });
    assert.equal(historic.type, "EmptyState");
    assert.doesNotMatch(JSON.stringify(historic), /Pol Guillem|Current registration/);
  }
});

test("el piloto público no activa alineaciones, registros Supabase, potencial ni apariencia", () => {
  assert.equal(PLAYER_FEATURES_ENABLED, false);
  const portal = read("../pages/ClubPortalPage.jsx");
  assert.match(portal, /!PLAYER_FEATURES_ENABLED\s*\?/);
  assert.match(portal, /<ClubRoster\b[^>]*privateView/);
  assert.match(read("../pages/TeamPage.jsx"), /<ClubRoster\b[^>]*editionId=\{selectedEdition\.id\}/);
  for (const file of ["../data/playerProfiles.js", "../lib/playerProfile.js", "../pages/PlayerPage.jsx", "../components/ClubRoster.jsx"]) {
    const source = read(file);
    assert.doesNotMatch(source, /\.from\(|\.rpc\(|\.insert\(|\.upsert\(|import .*supabase/i, file);
    assert.doesNotMatch(source, /player\.(?:potential|appearance|headassetid|contractvaliduntil|pacdiv|shohan|paskic|driref|defspe|phypos)\b/i, file);
  }
});
