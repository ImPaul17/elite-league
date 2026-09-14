import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAttributeTone } from "./playerProfile.js";

test("los atributos cambian de tono en 40, 60, 70 y 80, incluyendo el cero real", () => {
  const examples = [
    [0, "very-low"], [1, "very-low"], [39, "very-low"], [39.99, "very-low"],
    [40, "low"], [59, "low"], [59.99, "low"],
    [60, "medium"], [69, "medium"], [69.99, "medium"],
    [70, "good"], [79, "good"], [79.99, "good"],
    [80, "high"], [99, "high"], [100, "high"],
  ];
  for (const [value, expected] of examples) {
    assert.equal(getAttributeTone(value), expected, `Atributo ${value}`);
  }
});

test("los atributos ausentes, no numéricos o no finitos usan un tono neutral", () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity, "", "0", "80", true, false, {}, []]) {
    assert.equal(getAttributeTone(value), "neutral", `Valor inválido: ${String(value)}`);
  }
});

test("la ficha declara los cinco colores solicitados y las barras heredan el tono", () => {
  const css = readFileSync(new URL("../components/player-profile.css", import.meta.url), "utf8");
  const palette = {
    high: "#3E7C34",
    good: "#669C46",
    medium: "#BCB627",
    low: "#BC6426",
    "very-low": "#BD2726",
  };
  for (const [tone, color] of Object.entries(palette)) {
    assert.match(css, new RegExp(
      `\\.player-profile-page\\s+\\[data-tone=["']${tone}["']\\]\\s*\\{[^}]*\\bcolor:\\s*${color}\\s*[;}]`,
      "i",
    ), `El tono ${tone} debe declarar ${color}`);
  }
  assert.match(css, /\.player-attribute-meter\s+i\s*\{[^}]*\bbackground(?:-color)?:\s*currentColor\s*[;}]/i);
});
