import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { transformWithEsbuild } from "vite";
import { PLAYER_PROFILES, getPlayerProfile } from "../data/playerProfiles.js";
import { getPlayerCardStatistics, getPlayerDisplayName, getPlayerPositionLabel } from "./playerProfile.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const player = getPlayerProfile("pol-guillem");
const pico = { id: "pico-fc", name: "Pico FC", shortName: "Pico", crest: "/preview/elite/crests/pico-fc.png" };
const source = read("../components/PlayerCard.jsx")
  .replace(/^import .+;\r?\n/gm, "")
  .replace("export function PlayerCard", "function PlayerCard");
const { code } = await transformWithEsbuild(source, "PlayerCard.jsx", {
  loader: "jsx", jsxFactory: "createElement", jsxFragment: "Fragment",
});
const bindings = {
  createElement, Fragment,
  siteAsset: (path) => `/preview/elite/${path.replace(/^\//, "")}`,
  getPlayerCardStatistics, getPlayerDisplayName, getPlayerPositionLabel,
};
const PlayerCard = new Function(...Object.keys(bindings), `${code}\nreturn PlayerCard;`)(...Object.values(bindings));
const renderCard = (props = {}) => renderToStaticMarkup(createElement(PlayerCard, { player, ...props }));

function renderedStatistics(markup) {
  const statistics = markup.match(/<dl class="player-card-statistics"[^>]*>(.*?)<\/dl>/s)?.[1];
  assert.ok(statistics, "La tarjeta debe presentar sus estadísticas de competición");
  return [...statistics.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]*)<\/dd>/g)]
    .map(([, label, value]) => [label, value]);
}

test("la tarjeta mantiene la proporción del PSD sin reorganizarse en móvil", () => {
  const css = read("../components/player-card.css");
  assert.match(css, /aspect-ratio:\s*1597\s*\/\s*641/);
  assert.doesNotMatch(css, /@(?:media|container)/);
  const roster = read("../components/player-profile.css");
  assert.match(roster, /container:\s*club-roster\s*\/\s*inline-size/);
  assert.match(roster, /@container club-roster \(min-width: 1020px\)[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(roster, /@container club-roster \(min-width: 660px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
});

test("la tarjeta de Pol conserva retrato, bandera e identidad bajo la base de despliegue", () => {
  const markup = renderCard();
  assert.match(markup, /<img src="\/preview\/elite\/players\/pol-guillem\.png" alt="Retrato de Pol Guillem"/);
  assert.match(markup, /<img src="\/preview\/elite\/flags\/es\.png" alt=""/);
  assert.match(markup, /aria-label="España"/);
  assert.match(markup, />ESP<\/span>/);
  assert.match(markup, /<dt>Media<\/dt><dd>86<\/dd>/);
  assert.match(markup, /<dt>Dorsal<\/dt><dd>1<\/dd>/);
  assert.match(markup, /<dt class="visually-hidden">Posición<\/dt><dd>POR<\/dd>/);
});

test("la posición usa el mismo tamaño de texto que la etiqueta Dorsal", () => {
  const css = read("../components/player-card.css");
  const fontSizeFor = (selector) => css.split(`${selector} {`)[1]?.split("}")[0]?.match(/font-size:\s*([^;]+);/)?.[1];
  const dorsalSize = fontSizeFor(".player-card-dorsal dt");
  assert.ok(dorsalSize);
  assert.equal(fontSizeFor(".player-card-position dd"), dorsalSize);
});

test("la tarjeta muestra el escudo y el código del club cuando recibe Pico FC", () => {
  const markup = renderCard({ club: pico });
  assert.match(markup, /<div class="player-card-club" aria-label="Pico FC">/);
  assert.match(markup, /<img src="\/preview\/elite\/crests\/pico-fc\.png" alt="" width="82" height="82"/);
  assert.match(markup, /<span aria-hidden="true">PIC<\/span>/);
  assert.doesNotMatch(markup, /\/preview\/elite\/preview\/elite\//);
});

test("la tarjeta de Javi muestra su miniface, Camerún y ambas posiciones en español", () => {
  const markup = renderCard({ player: getPlayerProfile("javi-diop"), club: pico });
  assert.match(markup, /<img src="\/preview\/elite\/players\/javi-diop\.png" alt="Retrato de Javi Diop"/);
  assert.match(markup, /<img src="\/preview\/elite\/flags\/cm\.png" alt=""/);
  assert.match(markup, /aria-label="Camerún"/);
  assert.match(markup, />CMR<\/span>/);
  assert.match(markup, /<dt class="visually-hidden">Posición<\/dt><dd>LD · DFC<\/dd>/);
});

test("la tarjeta de Fran Ríos conserva nombre, miniface, dorsal 6 y posición MCD", () => {
  const markup = renderCard({ player: getPlayerProfile("fran-rios"), club: pico });
  assert.match(markup, /<h3 class="player-card-name">Fran Ríos<\/h3>/);
  assert.match(markup, /<img src="\/preview\/elite\/players\/fran-rios\.png" alt="Retrato de Fran Ríos"/);
  assert.match(markup, /<img src="\/preview\/elite\/flags\/es\.png" alt=""/);
  assert.match(markup, /<dt>Dorsal<\/dt><dd>6<\/dd>/);
  assert.match(markup, /<dt>Media<\/dt><dd>83<\/dd>/);
  assert.match(markup, /<dt class="visually-hidden">Posición<\/dt><dd>MCD<\/dd>/);
  assert.deepEqual(renderedStatistics(markup), [
    ["Partidos", "0"], ["Goles", "0"], ["Amarillas", "0"], ["Azules", "0"],
  ]);
});

test("las nuevas tarjetas de Pico mantienen apodos, dorsales y posiciones españolas", () => {
  for (const [slug, name, dorsal, position, rating] of [
    ["joan", "Joan", 7, "DC", 84],
    ["kike", "Kike", 2, "LI", 84],
    ["carlos-castro", "Carlos Castro", 13, "MC", 84],
    ["carlos-pelaz", "Carlos Pelaz", 12, "DC", 84],
    ["bruno-zapata", "Bruno Zapata", 15, "MD", 85],
    ["robert", "Robert", 16, "MD", 85],
    ["juan-carlos", "Juan Carlos", 8, "MC · MCO", 86],
    ["guti", "Guti", 17, "MC · MCO", 88],
  ]) {
    const markup = renderCard({ player: getPlayerProfile(slug), club: pico });
    assert.ok(markup.includes(`src="/preview/elite/players/${slug}.png" alt="Retrato de ${name}"`));
    assert.ok(markup.includes(`>${name}</h3>`));
    assert.ok(markup.includes(`<dt>Dorsal</dt><dd>${dorsal}</dd>`));
    assert.ok(markup.includes(`<dt>Media</dt><dd>${rating}</dd>`));
    assert.ok(markup.includes(`<dt class="visually-hidden">Posición</dt><dd>${position}</dd>`));
    assert.deepEqual(renderedStatistics(markup), [
      ["Partidos", "0"], ["Goles", "0"], ["Amarillas", "0"], ["Azules", "0"],
    ]);
  }
});

test("solo Guti lleva la variante dorada de comodín, tanto en plantilla como en ficha", () => {
  assert.deepEqual(PLAYER_PROFILES.filter(player => player.isWildcard).map(player => player.slug), ["guti"]);
  for (const headingAs of ["h4", "h1"]) {
    const markup = renderCard({ player: getPlayerProfile("guti"), club: pico, headingAs });
    assert.match(markup, /class="player-card player-card-wildcard"/);
    assert.match(markup, /<span class="visually-hidden">Jugador comodín<\/span>/);
    assert.ok(markup.includes(`<${headingAs} class="player-card-name">Guti</${headingAs}>`));
  }
  for (const regular of PLAYER_PROFILES.filter(player => player.slug !== "guti")) {
    assert.doesNotMatch(renderCard({ player: regular }), /player-card-wildcard|Jugador comodín/);
  }
  const css = read("../components/player-card.css");
  assert.match(css, /\.player-card-wildcard\s*\{\s*--player-card-ink:\s*#d4af37;\s*--player-card-position-ink:\s*#d4af37;/);
  assert.match(css, /\.player-card\s*\{\s*--player-card-ink:\s*#eaeaea;/);
});

test("Samuel conserva su nombre completo con un tamaño compacto sin cambiar las demás tarjetas", () => {
  const markup = renderCard({ player: getPlayerProfile("samuel-jimenez"), club: pico });
  assert.match(markup, /<h3 class="player-card-name player-card-name-compact">Samuel Jiménez<\/h3>/);
  assert.match(markup, /<img src="\/preview\/elite\/players\/samuel-jimenez\.png" alt="Retrato de Samuel Jiménez"/);
  assert.match(markup, /<dt>Dorsal<\/dt><dd>4<\/dd>/);
  assert.match(markup, /<dt class="visually-hidden">Posición<\/dt><dd>LD<\/dd>/);
  for (const slug of ["pol-guillem", "raul-miranda", "javi-diop"]) {
    assert.doesNotMatch(renderCard({ player: getPlayerProfile(slug) }), /player-card-name-compact/);
  }
});

test("la tarjeta admite la ausencia de club sin perder identidad ni estadísticas", () => {
  for (const club of [undefined, null]) {
    const markup = renderCard({ club });
    assert.doesNotMatch(markup, /player-card-club|src="(?:undefined|null)"/);
    assert.match(markup, /<h3 class="player-card-name">Pol Guillem<\/h3>/);
    assert.equal(renderedStatistics(markup).length, 4);
  }
});

test("la tarjeta actualizada presenta los datos sin las antiguas cajas", () => {
  assert.doesNotMatch(renderCard({ club: pico }), /\bplayer-card-tile\b/);
});

test("la tarjeta muestra las cuatro estadísticas iniciales sin ratio ni tarjetas rojas", () => {
  const markup = renderCard();
  assert.deepEqual(renderedStatistics(markup), [
    ["Partidos", "0"], ["Goles encajados", "0"], ["Amarillas", "0"], ["Azules", "0"],
  ]);
  assert.doesNotMatch(markup, /ratio|redCards|rojas/i);
});

test("la tarjeta ofrece h3 en la plantilla y h1 en la ficha individual", () => {
  const rosterCard = renderCard();
  assert.match(rosterCard, /<h3 class="player-card-name">Pol Guillem<\/h3>/);
  assert.doesNotMatch(rosterCard, /<h1\b/);
  const profileCard = renderCard({ headingAs: "h1" });
  assert.match(profileCard, /<h1 class="player-card-name">Pol Guillem<\/h1>/);
  assert.doesNotMatch(profileCard, /<h3\b/);
});

test("los datos ausentes se muestran como raya y no se convierten en ceros", () => {
  const markup = renderCard({ player: { ...player, competitionStats: undefined, overall: null, shirtNumber: undefined } });
  assert.deepEqual(renderedStatistics(markup), [
    ["Partidos", "—"], ["Goles encajados", "—"], ["Amarillas", "—"], ["Azules", "—"],
  ]);
  assert.match(markup, /<dt>Media<\/dt><dd>—<\/dd>/);
  assert.match(markup, /<dt>Dorsal<\/dt><dd>—<\/dd>/);
  assert.doesNotMatch(markup, /<dd>0<\/dd>/);
});

test("la tarjeta conserva la identidad cuando falta el retrato", () => {
  const markup = renderCard({ player: { ...player, portrait: undefined } });
  assert.match(markup, /<span class="player-card-portrait-placeholder" aria-hidden="true">P<\/span>/);
  assert.match(markup, /<h3 class="player-card-name">Pol Guillem<\/h3>/);
  assert.doesNotMatch(markup, /<img[^>]*alt="Retrato|src="(?:undefined|null)"/);
});

test("la plantilla y la ficha individual reutilizan el mismo componente de tarjeta", () => {
  assert.match(read("../components/ClubRoster.jsx"), /<PlayerCard\s+player=\{player\}\s+club=\{club\}\s+headingAs="h4"\s*\/>/);
  assert.match(read("../pages/PlayerPage.jsx"), /<PlayerCard\s+player=\{player\}\s+club=\{club\}\s+headingAs="h1"\s*\/>/);
});
