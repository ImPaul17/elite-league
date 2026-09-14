import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path, encoding) => readFileSync(new URL(`../${path}`, import.meta.url), encoding);

test("las banderas son los PNG originales del pack Country Flags de Flaticon", () => {
  const originals = {
    es: "4516c51b6bb8fe1bd7dde86389a06008a5e1550912a6a97a037e7419eea09a0d",
    pt: "f87db6616e237c7e4504f80d6bc21691c66c67110e6b50df49c1f6c3c69db0fa",
    cm: "f764ab3ba3aac6f7184776a637e2a8dcd5bb50edff2d408ae77c885903c0107b",
  };
  for (const [country, hash] of Object.entries(originals)) {
    const png = read(`public/flags/${country}.png`);
    assert.equal(createHash("sha256").update(png).digest("hex"), hash);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
    assert.equal(png[25], 6, "PNG RGBA con transparencia");
  }
});

test("las fuentes de las banderas se documentan sin mostrar el texto de crédito en plantilla y ficha", () => {
  for (const file of ["src/components/ClubRoster.jsx", "src/pages/PlayerPage.jsx"]) {
    assert.doesNotMatch(read(file, "utf8"), /FlagAttribution|Banderas de/);
  }
  const source = read("public/flags/ATTRIBUTION.md", "utf8");
  assert.match(source, /https:\/\/www\.flaticon\.com\/authors\/magnific/);
  assert.match(source, /https:\/\/www\.flaticon\.com\/packs\/countrys-flags/);
  assert.match(source, /spain_197593/);
  assert.match(source, /portugal_197463/);
  assert.match(source, /cameroon_197531/);
  assert.doesNotMatch(read("scripts/export-player-card.py", "utf8"), /"flags\/es.png"/);
});
