import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../src/components/competition.jsx");
const board = source.split("export function OfficialStandingsBoard(")[1].split("function FixtureTeam(")[0];
const css = read("../src/styles.css");

test("inicio y clasificación comparten el tablero oficial también en móvil", () => {
  assert.match(read("../src/pages/HomePage.jsx"), /<OfficialStandingsBoard standings=\{standings\}/);
  assert.match(read("../src/pages/StandingsPage.jsx"), /<OfficialStandingsBoard standings=\{standings\}/);
  assert.doesNotMatch(board, /official-board-desktop|official-board-mobile/);
  assert.equal((board.match(/<StandingsTable\b/g) ?? []).length, 1, "solo se conserva el fallback para un número de clubes no soportado");
  assert.match(board, /if \(standings.length !== config.rows\) return <StandingsTable/);
  assert.match(board, /standings\.map\(\(row, index\)/);
  assert.match(board, /OFFICIAL_STANDINGS_COLUMNS\.map/);
});

test("el tablero ofrece una región de desplazamiento accesible y una indicación para móvil", () => {
  assert.match(board, /className="official-standings-scroll" role="region" aria-label="Clasificación completa, desplazamiento horizontal" tabIndex=\{0\}/);
  assert.match(board, /official-standings-scroll-hint/);
  assert.match(css, /\.official-standings-scroll:focus-visible\s*\{[^}]*outline:/);
  assert.match(board, /<div role="rowgroup">\s*<div role="row">\s*<div className="official-standings-heading/);
});

test("solo la tabla crece y se desliza, sin ensanchar el panel ni cambiar las tarjetas de partidos", () => {
  assert.match(css, /\.panel-table\s*\{[^}]*min-width:\s*0;/);
  assert.match(css, /\.official-standings-scroll\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/);
  assert.match(css, /@media \(max-width: 760px\)\s*\{\s*\.official-board-desktop\s*\{ display: none; \}\s*\.official-board-mobile\s*\{ display: block; \}\s*\.official-standings-scroll\s*\{[^}]*overflow-x:\s*auto;/);
  assert.match(css, /\.official-standings-board\s*\{ min-width: 900px; \}/);
  assert.doesNotMatch(css, /touch-action:\s*(none|pan-x)\s*;/);
});
