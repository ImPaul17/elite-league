import test from "node:test";
import assert from "node:assert/strict";
import { formatNewsDate, getPublishedNews, isPublishedNews, makeNewsSlug, newsPublicationDate, safeNewsCover, safeNewsLink, splitNewsParagraph, validateNewsInput } from "./news.js";

test("las vistas públicas excluyen borradores, retiradas, fechas inválidas y futuras", () => {
  const records = [
    { id: "draft", publishedAt: null }, { id: "missing" },
    { id: "invalid", publishedAt: "mal" }, { id: "future", publishedAt: "2027-01-01" },
    { id: "visible", publishedAt: "2026-01-01" },
  ];
  assert.deepEqual(getPublishedNews(records, { now: new Date("2026-09-06") }).map((item) => item.id), ["visible"]);
  assert.equal(isPublishedNews(records[0]), false);
  assert.equal(records.length, 5);
});

test("destacadas primero, luego recientes, y el límite de Inicio no muta los datos", () => {
  const records = [
    { id: "recent", publishedAt: "2026-02-01" },
    { id: "featured", publishedAt: "2026-01-01", featured: true },
    { id: "old", publishedAt: "2025-01-01" },
  ];
  assert.deepEqual(getPublishedNews(records, { limit: 2 }).map((item) => item.id), ["featured", "recent"]);
  assert.equal(records[0].id, "recent");
});

test("editar conserva fecha pública; retirar la borra y volver a publicar usa la actual", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");
  assert.equal(newsPublicationDate({ publishedAt: "2026-01-01" }, true, now), "2026-01-01");
  assert.equal(newsPublicationDate({ publishedAt: "2026-01-01" }, false, now), null);
  assert.equal(newsPublicationDate({ publishedAt: null }, true, now), now.toISOString());
  assert.equal(newsPublicationDate({ publishedAt: "2027-01-01" }, true, now), now.toISOString());
});

test("portadas y enlaces rechazan JavaScript, datos, credenciales y URL relativas a otro host", () => {
  for (const invalid of ["javascript:alert(1)", "data:image/svg+xml,test", "http://example.com/a.png", "//example.com/a.png", "https://user:secret@example.com/a", "/\\evil.com/a", "/%2fevil.com/a", "https:\n//example.com"]) {
    assert.equal(safeNewsCover(invalid), "", invalid);
    assert.equal(safeNewsLink(invalid), "", invalid);
  }
  assert.equal(safeNewsCover("/news/portada.png", "/elite-league/"), "/elite-league/news/portada.png");
  assert.equal(safeNewsCover("https://example.com/cover.png"), "https://example.com/cover.png");
});

test("los borradores pueden estar incompletos, publicar exige título resumen y cuerpo", () => {
  assert.equal(validateNewsInput({ title: "Borrador" }).error, undefined);
  assert.ok(validateNewsInput({ title: "Noticia", publish: true }).error);
  assert.ok(validateNewsInput({ title: " ", body: "Texto" }).error);
  assert.ok(validateNewsInput({ title: "a".repeat(181) }).error);
  assert.ok(validateNewsInput({ title: "Noticia", coverPath: "javascript:alert(1)" }).error);
  assert.deepEqual(validateNewsInput({ title: " Noticia ", excerpt: " Resumen ", body: " Uno\r\n\r\nDos ", publish: true }).value, {
    title: "Noticia", excerpt: "Resumen", body: "Uno\n\nDos", category: "Actualidad", coverPath: "", featured: false, publish: true,
  });
});

test("cuerpo renderizable conserva texto y solo convierte enlaces HTTPS explícitos", () => {
  assert.deepEqual(splitNewsParagraph("Tráiler: https://youtu.be/abc. <script>alert(1)</script>"), [
    { text: "Tráiler: " }, { text: "https://youtu.be/abc", href: "https://youtu.be/abc" },
    { text: "." }, { text: " <script>alert(1)</script>" },
  ]);
  assert.deepEqual(splitNewsParagraph("https://user:pass@example.com/a"), [{ text: "" }, { text: "https://user:pass@example.com/a" }, { text: "" }]);
});

test("slugs estables aptos para las rutas y fechas ausentes sin excepción", () => {
  assert.equal(makeNewsSlug("¡Vuelve la competición!", "abc123"), "vuelve-la-competicion-abc123");
  assert.equal(makeNewsSlug("🎉", "abc123"), "noticia-abc123");
  assert.equal(formatNewsDate(null), "Sin publicar");
  assert.equal(formatNewsDate("invalid"), "Sin publicar");
});
