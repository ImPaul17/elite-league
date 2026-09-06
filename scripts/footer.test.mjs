import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const footer = read("../src/components/ui.jsx").split("export function AppFooter() {")[1];
const css = read("../src/components/footer.css");

test("el título de patrocinadores queda encima y fuera de la tira animada", () => {
  assert.match(footer, /aria-labelledby="footer-sponsors-title"/);
  assert.match(footer, /<h2 id="footer-sponsors-title" className="footer-sponsors-title">Patrocinadores oficiales<\/h2>\s+<div className="footer-sponsors-track">/);
  assert.match(css, /\.footer-sponsors-title\s*\{[^}]*font-weight: 820;[^}]*text-align: center;[^}]*text-transform: uppercase;/);
});

test("el copyright mantiene el año dinámico, centrado y tipografía de marca sin navegación en el footer", () => {
  assert.match(footer, /<small className="footer-copyright">©\s*\{new Date\(\)\.getFullYear\(\)\}\s*Elite League<\/small>/);
  assert.doesNotMatch(footer, /<nav\b|footer-links|to="\/(?:competicion|partidos|noticias)"/);
  assert.doesNotMatch(css, /\.footer-links\b/);

  const bottom = css.match(/\.footer-bottom\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(bottom, /display:\s*flex\s*;/);
  assert.match(bottom, /justify-content:\s*center\s*;/);
  assert.match(bottom, /padding:\s*25px\s+0\s*;/);

  const copyright = css.match(/\.footer-copyright\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(copyright, /font-weight:\s*820\s*;/);
  assert.match(copyright, /font-stretch:\s*115%\s*;/);
  assert.match(copyright, /font-variation-settings:\s*"wdth"\s+115\s*;/);
  assert.match(copyright, /text-transform:\s*uppercase\s*;/);
  assert.match(copyright, /text-align:\s*center\s*;/);
});

test("el footer conserva la tira original y su proporción de 9669 por 200", () => {
  const png = readFileSync(new URL("../public/sponsors/sponsor-strip-white.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 9669);
  assert.equal(png.readUInt32BE(20), 200);
  assert.equal(png[25], 6, "RGBA conserva la transparencia");
  assert.match(footer, /width="9669"\s+height="200"/);
  assert.match(css, /max-width: none/);
});

test("el carrusel repite tres copias sin controles ni pausa por ratón o foco", () => {
  assert.match(footer, /\[0, 1, 2\]\.map/);
  assert.match(footer, /aria-hidden=\{copy > 0 \? true : undefined\}/);
  assert.doesNotMatch(footer, /<button|isPaused|is-paused/);
  assert.doesNotMatch(css, /animation-play-state:\s*paused|footer-sponsors:hover|footer-sponsors:focus/);
  assert.match(css, /footer-sponsors-scroll 125s linear infinite/);
  assert.match(css, /translateX\(calc\(-100% \/ 3\)\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("Patrocinadores ya no tiene página, ruta ni enlace de navegación", () => {
  assert.equal(existsSync(new URL("../src/pages/SponsorsPage.jsx", import.meta.url)), false);
  for (const source of [footer, read("../src/App.jsx"), read("../src/app/routes.js")]) {
    assert.doesNotMatch(source, /SponsorsPage|\/patrocinadores/);
  }
  assert.doesNotMatch(read("../src/styles.css"), /sponsors-hero/);
});

test("el footer conserva ambas marcas y elimina la frase anterior", () => {
  assert.match(footer, /alt="Elite League"/);
  assert.match(footer, /src=\{siteAsset\("\/sponsors\/adidas\.png"\)\} alt="adidas" width="900" height="536"/);
  const adidas = readFileSync(new URL("../public/sponsors/adidas.png", import.meta.url));
  assert.equal(adidas.readUInt32BE(16), 900);
  assert.equal(adidas.readUInt32BE(20), 536);
  assert.doesNotMatch(footer, /Powered by adidas|powered-by-adidas/);
  assert.match(css, /filter: brightness\(0\) invert\(1\)/);
  assert.doesNotMatch(footer, /Competición oficial de FC Rush|creada para que cada jornada cuente/);
});
