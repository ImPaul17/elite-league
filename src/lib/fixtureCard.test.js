import assert from "node:assert/strict";
import test from "node:test";
import { CLUBS, MATCHDAYS } from "../data/league.js";
import { getHistoricCompetitionData } from "../data/historyResults.js";
import { getMatchStatus, isOfficialResult } from "./leagueEngine.js";
import { getFixtureCardModel } from "./fixtureCard.js";

const clubsById = Object.fromEntries(CLUBS.map(club => [club.id, club]));
const baseMatch = {
  homeClubId: "pico-fc",
  awayClubId: "ca-coca-jrs",
  order: 1,
  matchdayNumber: 1,
  status: "scheduled",
};

test("resuelve ambos clubes exclusivamente del diccionario suministrado y conserva sus rutas y escudos históricos", () => {
  for (const editionId of ["split-1", "split-2", "elite-cup"]) {
    const history = getHistoricCompetitionData(editionId, CLUBS);
    const historicClubs = Object.fromEntries(history.clubs.map(club => [club.id, club]));
    const match = history.regularMatches.find(item => item.homeClubId === "pico-fc");
    const model = getFixtureCardModel(match, historicClubs);
    for (const side of ["home", "away"]) {
      const club = historicClubs[match[`${side}ClubId`]];
      assert.strictEqual(model[side].club, club);
      assert.equal(model[side].name, club.name);
      assert.equal(model[side].href, `/equipos/${club.id}/${editionId}`);
      assert.equal(model[side].club.crest, club.crest);
    }
    assert.notEqual(model.home.club.crest, clubsById["pico-fc"].crest);
  }
});

test("los clubes actuales sin profilePath enlazan a su perfil y la ruta explícita tiene prioridad", () => {
  const model = getFixtureCardModel(baseMatch, clubsById);
  assert.equal(model.home.href, "/equipos/pico-fc");
  assert.equal(model.away.href, "/equipos/ca-coca-jrs");
  const customClub = { id: "pico-fc", name: "Pico histórico", crest: "/old.png", profilePath: "/equipos/pico-fc/split-1" };
  assert.equal(getFixtureCardModel(baseMatch, { "pico-fc": customClub }).home.href, customClub.profilePath);
});

test("un diccionario vacío o parcial no recupera clubes actuales ni inventa enlaces", () => {
  const missing = { club: null, name: "Equipo por definir", href: null };
  const empty = getFixtureCardModel(baseMatch);
  assert.deepEqual(empty.home, missing);
  assert.deepEqual(empty.away, missing);
  const partial = getFixtureCardModel(baseMatch, { "pico-fc": clubsById["pico-fc"] });
  assert.strictEqual(partial.home.club, clubsById["pico-fc"]);
  assert.deepEqual(partial.away, missing);
  assert.deepEqual(getFixtureCardModel(baseMatch, null).home, missing);
  assert.deepEqual(getFixtureCardModel({ homeClubId: "constructor", awayClubId: "__proto__" }).home, missing);
  assert.deepEqual(getFixtureCardModel(baseMatch, Object.create(clubsById)).away, missing);
});

test("conserva ceros oficiales tanto en el marcador como en la tanda", () => {
  const match = { ...baseMatch, status: "confirmed", score: { home: 0, away: 0 }, penalties: { home: 0, away: 1 } };
  const model = getFixtureCardModel(match, clubsById);
  assert.equal(model.hasResult, true);
  assert.equal(model.homeScore, 0);
  assert.equal(model.awayScore, 0);
  assert.deepEqual(model.penalties, { home: 0, away: 1 });
  assert.deepEqual(model.status, { label: "Finalizado", tone: "finished" });
  assert.match(model.accessibleLabel, /Resultado 0 a 0/);
  assert.match(model.accessibleLabel, /Penaltis 0 a 1/);
  assert.deepEqual(getFixtureCardModel({ ...match, penalties: { home: 1, away: 0 } }).penalties, { home: 1, away: 0 });
});

test("no publica marcadores ni penaltis de partidos scheduled, reported o live", () => {
  for (const [status, label] of [["scheduled", "Por jugar"], ["reported", "Pendiente de validar"], ["live", "En directo"]]) {
    const match = { ...baseMatch, status, score: { home: 4, away: 4 }, penalties: { home: 3, away: 2 } };
    const model = getFixtureCardModel(match, clubsById);
    assert.equal(model.status.label, label);
    assert.equal(model.hasResult, false);
    assert.equal(model.homeScore, null);
    assert.equal(model.awayScore, null);
    assert.equal(model.penalties, null);
    assert.ok(model.accessibleLabel.includes(label));
    assert.doesNotMatch(model.accessibleLabel, /Resultado|Penaltis/);
  }
});

test("un confirmado necesita ambos goles finitos para mostrar resultado", () => {
  for (const score of [undefined, null, {}, { home: 0 }, { home: 0, away: "0" }, { home: NaN, away: 0 }, { home: 0, away: Infinity }]) {
    const model = getFixtureCardModel({ ...baseMatch, status: "confirmed", score, penalties: { home: 1, away: 0 } });
    assert.equal(model.hasResult, false);
    assert.equal(model.homeScore, null);
    assert.equal(model.awayScore, null);
    assert.equal(model.penalties, null);
    assert.equal(model.status.tone, "scheduled");
    assert.doesNotMatch(model.accessibleLabel, /undefined|null|NaN|Infinity/);
  }
});

test("una tanda incompleta no oculta el marcador oficial ni convierte valores ausentes en cero", () => {
  for (const penalties of [undefined, null, {}, { home: 0 }, { away: 1 }, { home: "0", away: 1 }, { home: 0, away: NaN }, { home: Infinity, away: 1 }]) {
    const model = getFixtureCardModel({ ...baseMatch, status: "confirmed", score: { home: 0, away: 1 }, penalties });
    assert.equal(model.hasResult, true);
    assert.equal(model.homeScore, 0);
    assert.equal(model.awayScore, 1);
    assert.equal(model.penalties, null);
    assert.doesNotMatch(model.accessibleLabel, /Penaltis/);
  }
});

test("la numeración usa el orden global suministrado sin reinicios y solo rellena hasta dos dígitos", () => {
  for (const order of [1, 6, 7, 10, 12, 13, 16, 100]) {
    assert.equal(getFixtureCardModel({ order }).orderLabel, `Partido ${String(order).padStart(2, "0")}`);
  }
  for (const order of [undefined, null, 0, -1, 1.5, "7", NaN, Infinity, true]) {
    assert.equal(getFixtureCardModel({ order }).orderLabel, "Partido");
  }
});

test("la etapa prevalece sobre la jornada y showMatchday solo muestra números enteros positivos", () => {
  assert.equal(getFixtureCardModel(baseMatch).roundLabel, "");
  assert.equal(getFixtureCardModel(baseMatch, {}, { showMatchday: true }).roundLabel, "Jornada 1");
  assert.equal(getFixtureCardModel({ ...baseMatch, stage: "Octavos de final" }).roundLabel, "Octavos de final");
  assert.equal(getFixtureCardModel({ ...baseMatch, stage: "Final" }, {}, { showMatchday: true }).roundLabel, "Final");
  for (const stage of [undefined, null, "", "   ", false, 2, {}]) {
    assert.equal(getFixtureCardModel({ ...baseMatch, stage }, {}, { showMatchday: true }).roundLabel, "Jornada 1");
  }
  for (const matchdayNumber of [undefined, null, 0, -1, 1.5, "1", NaN, Infinity]) {
    assert.equal(getFixtureCardModel({ matchdayNumber }, {}, { showMatchday: true }).roundLabel, "");
  }
});

test("showDate controla una fecha existente de texto, también en la descripción accesible", () => {
  const match = { ...baseMatch, dateLabel: "21/01/2024" };
  const visible = getFixtureCardModel(match, clubsById);
  assert.equal(visible.dateLabel, match.dateLabel);
  assert.ok(visible.accessibleLabel.includes(match.dateLabel));
  const hidden = getFixtureCardModel(match, clubsById, { showDate: false });
  assert.equal(hidden.dateLabel, "");
  assert.ok(!hidden.accessibleLabel.includes(match.dateLabel));
  for (const dateLabel of [undefined, null, "", "   ", 0, 123, false, {}, new Date(0)]) {
    assert.equal(getFixtureCardModel({ dateLabel }).dateLabel, "");
  }
});

test("la descripción accesible resume equipos, estado, marcador, etapa y fecha sin campos técnicos", () => {
  const model = getFixtureCardModel({ ...baseMatch, order: 13, stage: "Final", dateLabel: "27/01/2024", status: "confirmed", score: { home: 3, away: 0 } }, clubsById);
  for (const fragment of ["Partido 13", "Final", "27/01/2024", "Pico FC contra CA Coca Jrs", "Finalizado", "Resultado 3 a 0"]) {
    assert.ok(model.accessibleLabel.includes(fragment), fragment);
  }
  assert.doesNotMatch(model.accessibleLabel, /undefined|null|NaN|pico-fc|ca-coca-jrs|Jornada/);
});

test("los partidos incompletos siguen devolviendo un modelo utilizable sin undefined", () => {
  for (const match of [undefined, null, {}, false, "", { homeClubId: "desconocido", stage: {}, order: undefined }]) {
    const model = getFixtureCardModel(match);
    assert.equal(model.home.name, "Equipo por definir");
    assert.equal(model.away.name, "Equipo por definir");
    assert.equal(model.orderLabel, "Partido");
    assert.equal(model.hasResult, false);
    assert.equal(model.homeScore, null);
    assert.equal(model.awayScore, null);
    assert.equal(model.penalties, null);
    assert.ok(Object.values(model).every(value => value !== undefined));
    assert.doesNotMatch(model.accessibleLabel, /undefined|null|NaN|\[object Object\]/);
  }
});

test("los 185 partidos históricos conservan clubes, resultados, tandas, etapa y orden", () => {
  let matchCount = 0;
  let penaltyCount = 0;
  for (const editionId of ["split-1", "split-2", "elite-cup"]) {
    const history = getHistoricCompetitionData(editionId, CLUBS);
    const historicClubs = Object.fromEntries(history.clubs.map(club => [club.id, club]));
    for (const match of [...history.regularMatches, ...history.playoffStages.flatMap(stage => stage.matches)]) {
      const model = getFixtureCardModel(match, historicClubs, { showMatchday: true });
      assert.strictEqual(model.home.club, historicClubs[match.homeClubId]);
      assert.strictEqual(model.away.club, historicClubs[match.awayClubId]);
      assert.equal(model.hasResult, isOfficialResult(match));
      assert.deepEqual(model.status, getMatchStatus(match));
      assert.equal(model.homeScore, match.score.home);
      assert.equal(model.awayScore, match.score.away);
      assert.deepEqual(model.penalties, match.penalties);
      assert.equal(model.roundLabel, match.stage || `Jornada ${match.matchdayNumber}`);
      assert.equal(model.orderLabel, `Partido ${String(match.order).padStart(2, "0")}`);
      assert.equal(model.dateLabel, match.dateLabel || "");
      matchCount += 1;
      if (model.penalties) penaltyCount += 1;
    }
  }
  assert.equal(matchCount, 185);
  assert.equal(penaltyCount, 20);
});

test("los 66 encuentros pendientes del Split 3 mantienen enlaces y no inventan resultados o fechas", () => {
  const matches = MATCHDAYS.flatMap(matchday => matchday.matches);
  assert.equal(matches.length, 66);
  for (const match of matches) {
    const model = getFixtureCardModel(match, clubsById, { showMatchday: true });
    assert.equal(model.hasResult, false);
    assert.equal(model.homeScore, null);
    assert.equal(model.awayScore, null);
    assert.equal(model.penalties, null);
    assert.equal(model.dateLabel, "");
    assert.equal(model.home.href, `/equipos/${match.homeClubId}`);
    assert.equal(model.away.href, `/equipos/${match.awayClubId}`);
    assert.equal(model.roundLabel, `Jornada ${match.matchdayNumber}`);
    assert.equal(model.orderLabel, `Partido ${String(match.order).padStart(2, "0")}`);
  }
});

test("filtrar los grupos de Elite Cup no renumera las tarjetas de J2", () => {
  const history = getHistoricCompetitionData("elite-cup", CLUBS);
  const historicClubs = Object.fromEntries(history.clubs.map(club => [club.id, club]));
  assert.deepEqual(history.groups.map(group => group.regularMatches
    .filter(match => match.matchdayNumber === 2)
    .map(match => getFixtureCardModel(match, historicClubs, { showDate: false }).orderLabel)), [
    ["Partido 07", "Partido 10", "Partido 11"],
    ["Partido 08", "Partido 09", "Partido 12"],
  ]);
});

test("crear el modelo no modifica el partido, las opciones ni los clubes suministrados", () => {
  const home = Object.freeze({ id: "local", name: "Local", crest: "/local.png" });
  const away = Object.freeze({ id: "visitante", name: "Visitante", crest: "/visitante.png" });
  const dictionary = Object.freeze({ local: home, visitante: away });
  const score = Object.freeze({ home: 0, away: 0 });
  const penalties = Object.freeze({ home: 0, away: 1 });
  const match = Object.freeze({ homeClubId: "local", awayClubId: "visitante", status: "confirmed", score, penalties, order: 7, matchdayNumber: 2 });
  const options = Object.freeze({ showMatchday: true, showDate: false });
  const model = getFixtureCardModel(match, dictionary, options);
  assert.strictEqual(model.home.club, home);
  assert.strictEqual(model.away.club, away);
  assert.notStrictEqual(model.penalties, penalties);
  model.penalties.home = 5;
  assert.equal(match.penalties.home, 0);
  assert.equal(match.order, 7);
  assert.deepEqual(options, { showMatchday: true, showDate: false });
});
