import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transformWithEsbuild } from "vite";
import { getClubPlayerProfiles, getPlayerProfile } from "../data/playerProfiles.js";
import { getPlayerDisplayName, getPlayerPositionLabel } from "./playerProfile.js";
import { getPlayerRosterGroup, PLAYER_ROSTER_GROUPS } from "./playerPositions.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const element = (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) });
const source = read("../components/ClubRoster.jsx")
  .replace(/^import .+;\r?\n/gm, "")
  .replace("export function ClubRoster", "function ClubRoster");
const { code } = await transformWithEsbuild(source, "ClubRoster.jsx", { loader: "jsx", jsxFactory: "element", jsxFragment: "Fragment" });
const bindings = {
  getClubPlayerProfiles, getPlayerDisplayName, getPlayerPositionLabel, getPlayerRosterGroup, PLAYER_ROSTER_GROUPS,
  AppLink: "AppLink", EmptyState: "EmptyState", PlayerCard: "PlayerCard", FlagAttribution: "FlagAttribution",
};
const ClubRoster = new Function("element", ...Object.keys(bindings), `${code}\nreturn ClubRoster;`)(element, ...Object.values(bindings));
const pico = { id: "pico-fc", name: "Pico FC" };
const anotherClub = { id: "roster-test-club", name: "Test Club" };

function descendants(node, predicate) {
  if (!node || typeof node !== "object") return [];
  return [...(predicate(node) ? [node] : []), ...(node.children ?? []).flatMap((child) => descendants(child, predicate))];
}

const sections = (tree) => descendants(tree, (node) => node.type === "section" && node.props.className === "player-roster-group");
const sectionNamed = (tree, name) => sections(tree).find((node) => node.props["aria-label"] === name);
const nodesOfType = (tree, type) => descendants(tree, (node) => node.type === type);
const texts = (node) => !node || typeof node === "boolean" ? ""
  : typeof node !== "object" ? String(node) : (node.children ?? []).map(texts).join(" ");

test("real Pico profiles appear in their own lines with ordered headings and accessible card links", () => {
  const tree = ClubRoster({ club: pico });
  assert.deepEqual(sections(tree).map((node) => node.props["aria-label"]), ["Porteros", "Defensas", "Centrocampistas", "Delanteros"]);
  assert.deepEqual(nodesOfType(tree, "h3").map(texts), ["Porteros", "Defensas", "Centrocampistas", "Delanteros"]);

  for (const [slug, line, displayName] of [
    ["pol-guillem", "Porteros", "Pol Guillem"],
    ["raul-miranda", "Defensas", "Raúl Miranda"],
    ["javi-diop", "Defensas", "Javi Diop"],
    ["samuel-jimenez", "Defensas", "Samuel Jiménez"],
    ["fran-rios", "Centrocampistas", "Fran Ríos"],
    ["joan", "Delanteros", "Joan"],
    ["juan-carlos", "Centrocampistas", "Juan Carlos"],
    ["kike", "Defensas", "Kike"],
    ["carlos-castro", "Centrocampistas", "Carlos Castro"],
    ["carlos-pelaz", "Delanteros", "Carlos Pelaz"],
    ["bruno-zapata", "Centrocampistas", "Bruno Zapata"],
    ["robert", "Centrocampistas", "Robert"],
    ["guti", "Centrocampistas", "Guti"],
  ]) {
    const group = sectionNamed(tree, line);
    const links = nodesOfType(group, "AppLink").filter((node) => node.props.to === `/jugadores/${slug}`);
    assert.equal(links.length, 1);
    const [link] = links;
    assert.equal(link.props.to, `/jugadores/${slug}`);
    assert.equal(link.props["aria-label"], `Ver ficha de ${displayName}`);
    assert.equal(link.props.className, "player-roster-card");
    const [card] = nodesOfType(link, "PlayerCard");
    assert.equal(card.props.player, getPlayerProfile(slug));
    assert.equal(card.props.club, pico);
    assert.equal(card.props.headingAs, "h4");
    assert.equal(nodesOfType(link, "AppLink").length, 1, "no nested links");
  }
  assert.equal(nodesOfType(tree, "FlagAttribution").length, 0);
  assert.equal(nodesOfType(tree, "PlayerCard").length, 13);
  assert.equal(nodesOfType(sectionNamed(tree, "Porteros"), "PlayerCard").length, 1);
  assert.equal(nodesOfType(sectionNamed(tree, "Defensas"), "PlayerCard").length, 4);
  assert.equal(nodesOfType(sectionNamed(tree, "Centrocampistas"), "PlayerCard").length, 6);
  assert.doesNotMatch(texts(sectionNamed(tree, "Centrocampistas")), /Pendiente de jugadores\./);
  assert.equal(nodesOfType(sectionNamed(tree, "Delanteros"), "PlayerCard").length, 2);
  assert.doesNotMatch(texts(sectionNamed(tree, "Delanteros")), /Pendiente de jugadores\./);
});

test("registered players use English FIFA primary positions and display Spanish abbreviations", () => {
  const mappings = [
    ["GK", "Porteros", "POR"], ["CB", "Defensas", "DFC"],
    ["LB", "Defensas", "LI"], ["RB", "Defensas", "LD"],
    ["LWB", "Defensas", "CAI"], ["RWB", "Defensas", "CAD"],
    ["CDM", "Centrocampistas", "MCD"], ["CM", "Centrocampistas", "MC"],
    ["LM", "Centrocampistas", "MI"], ["RM", "Centrocampistas", "MD"], ["CAM", "Centrocampistas", "MCO"],
    ["LW", "Delanteros", "EI"], ["RW", "Delanteros", "ED"], ["CF", "Delanteros", "SD"], ["ST", "Delanteros", "DC"],
  ];
  const players = mappings.map(([position], index) => ({ id: `registration-${position}`, name: `Player ${position}`, position, shirtNumber: index + 1 }));
  const tree = ClubRoster({ club: anotherClub, players });
  assert.equal(nodesOfType(tree, "FlagAttribution").length, 0);
  for (const [position, group, label] of mappings) {
    const rows = descendants(sectionNamed(tree, group), (node) => node.props.key === `registration-${position}`);
    assert.equal(rows.length, 1, position);
    assert.deepEqual(nodesOfType(rows[0], "small").map(texts), [label]);
    assert.deepEqual(nodesOfType(rows[0], "strong").map(texts), [`Player ${position}`]);
    assert.equal(descendants(tree, (node) => node.props.key === `registration-${position}`).length, 1);
  }
});

test("multi-position registrations appear once, in their primary line rather than every compatible line", () => {
  const players = [
    { id: "multi-mid", name: "Midfielder winger", positions: ["LM", "LW", "MI"], positionGroup: "FWD" },
    { id: "multi-fwd", name: "Winger midfielder", positions: ["LW", "LM"], positionGroup: "MID" },
  ];
  const tree = ClubRoster({ club: anotherClub, players });
  assert.equal(descendants(sectionNamed(tree, "Centrocampistas"), (node) => node.props.key === "multi-mid").length, 1);
  assert.equal(descendants(sectionNamed(tree, "Delanteros"), (node) => node.props.key === "multi-fwd").length, 1);
  for (const player of players) assert.equal(descendants(tree, (node) => node.props.key === player.id).length, 1);
  const [row] = descendants(tree, (node) => node.props.key === "multi-mid");
  assert.deepEqual(nodesOfType(row, "small").map(texts), ["MI · EI"]);
});

test("unknown registrations stay visible after the four normal lines rather than disappearing", () => {
  const players = [
    { id: "unknown-player", name: "Unknown player", positions: ["Unknown role", "CB"], positionGroup: "DEF" },
    { id: "missing-player", name: "No position yet" },
  ];
  const tree = ClubRoster({ club: anotherClub, players });
  assert.deepEqual(sections(tree).map((node) => node.props["aria-label"]), ["Porteros", "Defensas", "Centrocampistas", "Delanteros", "Sin posición"]);
  const unknown = sectionNamed(tree, "Sin posición");
  for (const player of players) {
    assert.equal(descendants(unknown, (node) => node.props.key === player.id).length, 1);
    assert.equal(descendants(tree, (node) => node.props.key === player.id).length, 1);
  }
});

test("current registrations and Split 3 profiles never leak into historic squads", () => {
  for (const editionId of ["split-1", "split-2", "elite-cup"]) {
    const tree = ClubRoster({ club: pico, editionId, players: [{ id: "current-only", name: "Current-only player", position: "CB" }] });
    assert.equal(tree.type, "EmptyState", editionId);
    assert.equal(tree.props.title, "Plantilla pendiente");
    assert.doesNotMatch(JSON.stringify(tree), /pol-guillem|raul-miranda|javi-diop|samuel-jimenez|fran-rios|joan|juan-carlos|kike|carlos-castro|carlos-pelaz|bruno-zapata|robert|guti|Current-only player/);
  }
});

test("empty teams retain the original empty state and public or private explanation", () => {
  const publicTree = ClubRoster({ club: anotherClub });
  assert.equal(publicTree.type, "EmptyState");
  assert.equal(publicTree.props.title, "Plantilla pendiente");
  assert.equal(publicTree.props.description, "Los jugadores se añadirán cuando estén registrados.");
  const privateTree = ClubRoster({ club: anotherClub, privateView: true });
  assert.equal(privateTree.type, "EmptyState");
  assert.equal(privateTree.props.description, "Los jugadores de tu equipo aparecerán aquí cuando se incorporen.");
});

test("grouped squads retain compact three-card desktop rows and the unaltered card aspect ratio", () => {
  assert.match(read("../components/player-profile.css"), /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(read("../components/player-card.css"), /aspect-ratio:\s*1597\s*\/\s*641/);
});
