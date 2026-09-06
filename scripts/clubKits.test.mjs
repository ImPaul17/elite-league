import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { CLUBS } from "../src/data/league.js";
import { KIT_SPLITS, getClubKits } from "../src/data/clubKits.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const expectedClubIds = [
  "pico-fc", "ca-coca-jrs", "urss-fc", "bee-fc", "los-mugiwaras-fc", "impuestos-fc",
  "maki-fc", "lego-fc", "rayo-zeta", "estaross-fc", "karasuno-falcons", "el-caudillo-fc",
];
const variants = [
  { id: "home", label: "Local" },
  { id: "away", label: "Visitante" },
  { id: "goalkeeper", label: "Portero" },
];

test("el selector de equipaciones ofrece los tres splits y solo Split 3 tiene material", () => {
  assert.deepEqual(KIT_SPLITS, [
    { id: "split-1", label: "Split 1" },
    { id: "split-2", label: "Split 2" },
    { id: "split-3", label: "Split 3" },
  ]);
  assert.deepEqual(CLUBS.map(club => club.id), expectedClubIds);
  for (const clubId of expectedClubIds) {
    assert.deepEqual(KIT_SPLITS.map(split => getClubKits(clubId, split.id).length > 0), [false, false, true]);
  }
});

test("cada uno de los doce clubes tiene Local, Visitante y Portero en ese orden y Split 3 por defecto", () => {
  for (const clubId of expectedClubIds) {
    const expected = variants.map(variant => ({
      ...variant,
      src: `/clubs/kits/split-3/${clubId}-${variant.id}.png`,
      width: 1080,
      height: 1920,
    }));
    assert.deepEqual(getClubKits(clubId), expected, clubId);
    assert.deepEqual(getClubKits(clubId, "split-3"), expected, clubId);
  }
});

test("los 36 recursos son PNG RGBA de 1080×1920, sin rutas duplicadas ni archivos faltantes", () => {
  const kits = expectedClubIds.flatMap(clubId => getClubKits(clubId));
  assert.equal(kits.length, 36);
  assert.equal(new Set(kits.map(kit => kit.src)).size, 36);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const kit of kits) {
    const file = new URL(`../public${kit.src}`, import.meta.url);
    assert.ok(existsSync(file), `Falta ${kit.src}`);
    const png = readFileSync(file);
    assert.ok(png.length > 33, `PNG vacío o incompleto: ${kit.src}`);
    assert.deepEqual(png.subarray(0, 8), pngSignature, kit.src);
    assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR", kit.src);
    assert.equal(png.readUInt32BE(16), 1080, kit.src);
    assert.equal(png.readUInt32BE(20), 1920, kit.src);
    assert.equal(png[25], 6, `Debe conservar RGBA: ${kit.src}`);
    assert.equal(png.subarray(-8, -4).toString("ascii"), "IEND", `PNG truncado: ${kit.src}`);
  }
  const actualPngs = readdirSync(new URL("../public/clubs/kits/split-3/", import.meta.url))
    .filter(name => name.toLowerCase().endsWith(".png")).sort();
  assert.deepEqual(actualPngs, kits.map(kit => kit.src.split("/").at(-1)).sort());
});

test("otros splits, Elite Cup y valores desconocidos no reutilizan las equipaciones actuales", () => {
  for (const clubId of expectedClubIds) {
    for (const splitId of ["split-1", "split-2", "elite-cup", "split-4", "desconocido", "", null]) {
      assert.deepEqual(getClubKits(clubId, splitId), [], `${clubId}: ${String(splitId)}`);
    }
  }
});

test("los clubes inactivos o desconocidos no reciben imágenes de otro club", () => {
  for (const clubId of ["playmobil-fc", "cegatos-fc", "los-pikas-fc", "desconocido", "constructor", "__proto__", "", null, undefined]) {
    assert.deepEqual(getClubKits(clubId), [], String(clubId));
    for (const { id } of KIT_SPLITS) assert.deepEqual(getClubKits(clubId, id), [], `${String(clubId)}: ${id}`);
  }
});

test("la ficha pública y Mi equipo muestran una única sección justo después de la información del club", () => {
  for (const path of ["../src/pages/TeamPage.jsx", "../src/pages/ClubPortalPage.jsx"]) {
    const page = read(path);
    assert.match(page, /import\s*\{\s*ClubKits\s*\}\s*from\s*["']\.\.\/components\/ClubKits(?:\.jsx)?["']/);
    assert.match(page, /<ClubProfileOverview club=\{club\}\s*\/>\s*<ClubKits club=\{club\}\s*\/>/);
    assert.equal((page.match(/<ClubKits\b/g) ?? []).length, 1);
  }
});

test("los botones usan KIT_SPLITS y deshabilitan solo las ediciones sin material para ese club", () => {
  const component = read("../src/components/ClubKits.jsx");
  assert.match(component, /useState\("split-3"\)/);
  assert.match(component, /KIT_SPLITS\.map\(\(split\)\s*=>/);
  assert.match(component, /const available = getClubKits\(club\.id, split\.id\)\.length > 0;/);
  assert.match(component, /const selected = available && split\.id === selectedSplit;/);
  assert.match(component, /disabled=\{!available\}/);
  assert.match(component, /aria-pressed=\{selected\}/);
  assert.match(component, /aria-label=\{available \? split\.label : `\$\{split\.label\}: equipaciones no disponibles`\}/);
  assert.match(component, /onClick=\{\(\) => setSelectedSplit\(split\.id\)\}/);
});

test("las equipaciones mantienen imagen completa, carga diferida, etiquetas y estado vacío", () => {
  const component = read("../src/components/ClubKits.jsx");
  const css = read("../src/components/club-kits.css");
  assert.match(component, /aria-labelledby=\{titleId\}/);
  assert.match(component, /<SectionHeading\s+id=\{titleId\}\s+title="Equipaciones"/);
  assert.match(component, /src=\{siteAsset\(kit\.src\)\}/);
  assert.match(component, /width=\{kit\.width\}\s+height=\{kit\.height\}\s+loading="lazy"\s+decoding="async"/);
  assert.match(component, /alt=\{`Equipación .*club\.name.*KIT_SPLITS/);
  assert.match(component, /<figcaption>\{kit\.label\}<\/figcaption>/);
  assert.match(component, /kits\.length > 0 \?/);
  assert.match(component, /Todavía no hay equipaciones disponibles para este club\./);
  const imageRule = css.match(/\.club-kit img\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(imageRule, /height:\s*auto;/);
  assert.match(imageRule, /aspect-ratio:\s*1080\s*\/\s*1920;/);
  assert.match(imageRule, /object-fit:\s*contain;/);
});
