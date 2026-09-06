import assert from "node:assert/strict";
import test from "node:test";
import { SPLIT_3_PLAYOFF_STAGES } from "../data/split3Playoffs.js";

const matches = SPLIT_3_PLAYOFF_STAGES.flatMap((stage) => stage.matches);
const entrants = matches.flatMap((match) => [match.home, match.away]);
const entrantKey = (entrant) => entrant.type === "seed" ? `S${entrant.position}` : `G${entrant.matchOrder}`;

test("los cruces P7–P16 respetan exactamente el orden local y visitante confirmado", () => {
  assert.deepEqual(matches.map((match) => [match.code, entrantKey(match.home), entrantKey(match.away)]), [
    ["P7", "S10", "S11"],
    ["P8", "S5", "G7"],
    ["P9", "S6", "S9"],
    ["P10", "S7", "S8"],
    ["P11", "S2", "G10"],
    ["P12", "S3", "G9"],
    ["P13", "S4", "G8"],
    ["P14", "S1", "G13"],
    ["P15", "G11", "G12"],
    ["P16", "G14", "G15"],
  ]);
});

test("la numeración continúa de 7 a 16 tras J11 y mantiene los diez IDs estables", () => {
  assert.deepEqual(matches.map((match) => match.order), Array.from({ length: 10 }, (_, index) => index + 7));
  assert.deepEqual(matches.map((match) => match.code), Array.from({ length: 10 }, (_, index) => `P${index + 7}`));
  assert.deepEqual(matches.map((match) => match.id), Array.from({ length: 10 }, (_, index) => `split-3-playoff-${index + 1}`));
  assert.equal(new Set(matches.map((match) => match.id)).size, 10);
  assert.ok(matches.every((match) => typeof match.id === "string" && match.id.length > 0));
});

test("los partidos pertenecen a su ronda de acceso, octavos, cuartos, semifinales y final", () => {
  assert.deepEqual(SPLIT_3_PLAYOFF_STAGES.map((stage) => [stage.id, stage.matches.map((match) => match.order)]), [
    ["last-octavos-place", [7]],
    ["round-of-16", [8, 9, 10]],
    ["quarterfinals", [11, 12, 13]],
    ["semifinals", [14, 15]],
    ["final", [16]],
  ]);
});

test("cada referencia de ganador apunta a un partido anterior existente y el grafo no tiene ciclos", () => {
  const byOrder = new Map(matches.map((match) => [match.order, match]));
  for (const match of matches) {
    for (const entrant of [match.home, match.away]) {
      assert.ok(["seed", "winner"].includes(entrant.type), `Tipo de participante inválido en ${match.code}`);
      if (entrant.type !== "winner") continue;
      assert.ok(Number.isInteger(entrant.matchOrder), `Referencia no entera en ${match.code}`);
      assert.ok(byOrder.has(entrant.matchOrder), `Referencia inexistente en ${match.code}`);
      assert.ok(entrant.matchOrder < match.order, `Referencia futura o a sí mismo en ${match.code}`);
    }
  }

  const visited = new Set();
  const visiting = new Set();
  function visit(order) {
    assert.equal(visiting.has(order), false, `Ciclo en P${order}`);
    if (visited.has(order)) return;
    visiting.add(order);
    const match = byOrder.get(order);
    for (const entrant of [match.home, match.away]) {
      if (entrant.type === "winner") visit(entrant.matchOrder);
    }
    visiting.delete(order);
    visited.add(order);
  }
  visit(16);
  assert.equal(visited.size, 10, "Todos los partidos deben conducir a la final");
});

test("cada clasificado del primero al undécimo entra una sola vez y el duodécimo no participa", () => {
  const seeds = entrants.filter((entrant) => entrant.type === "seed").map((entrant) => entrant.position);
  assert.ok(seeds.every(Number.isInteger));
  assert.deepEqual(seeds.toSorted((a, b) => a - b), Array.from({ length: 11 }, (_, index) => index + 1));
  assert.equal(new Set(seeds).size, 11);
  assert.equal(seeds.includes(12), false);
});

test("cada ganador de P7 a P15 avanza exactamente una vez y el ganador de P16 no vuelve a jugar", () => {
  const winnerOrders = entrants.filter((entrant) => entrant.type === "winner").map((entrant) => entrant.matchOrder);
  assert.deepEqual(winnerOrders.toSorted((a, b) => a - b), Array.from({ length: 9 }, (_, index) => index + 7));
  assert.equal(new Set(winnerOrders).size, 9);
  assert.equal(winnerOrders.includes(16), false);
});

test("los escudos local y visitante se conservan y todos los participantes tienen una etiqueta informativa", () => {
  for (const match of matches) {
    assert.equal(match.home.crest, "/clubs/rest-of-elite-local.png", `${match.code}: escudo local`);
    assert.equal(match.away.crest, "/clubs/rest-of-elite-away.png", `${match.code}: escudo visitante`);
    for (const entrant of [match.home, match.away]) {
      assert.equal(typeof entrant.label, "string");
      assert.ok(entrant.label.trim().length > 0, `${match.code}: etiqueta vacía`);
      assert.doesNotMatch(entrant.label, /por\s+decidir/i, `${match.code}: etiqueta pendiente antigua`);
      assert.equal(entrant.label, entrant.type === "winner" ? `Ganador P${entrant.matchOrder}` : `${entrant.position}.º de liga`, `${match.code}: etiqueta y referencia deben coincidir`);
    }
  }
});
