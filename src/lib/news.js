const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

export function safeNewsLink(value) {
  if (typeof value !== "string" || CONTROL_CHARACTERS.test(value)) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

export function safeNewsCover(value, basePath = "/") {
  if (typeof value !== "string" || CONTROL_CHARACTERS.test(value)) return "";
  const path = value.trim();
  if (path.startsWith("/") && !path.startsWith("//")) {
    // A cover may be a public asset, never a protocol-relative external URL.
    if (/%(?:2f|5c|00|0a|0d)/i.test(path) || path.split(/[/?#]/).includes("..")) return "";
    return `${basePath.replace(/\/$/, "")}${path}`;
  }
  return safeNewsLink(path);
}

export function formatNewsDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(date)
    : "Sin publicar";
}

export function isPublishedNews(article, now = Date.now()) {
  const publishedTime = article?.publishedAt ? new Date(article.publishedAt).getTime() : NaN;
  return Number.isFinite(publishedTime) && publishedTime <= Number(now);
}

export function newsPublicationDate(article, publish, now = new Date()) {
  if (!publish) return null;
  return isPublishedNews(article, now.getTime()) ? article.publishedAt : now.toISOString();
}

export function getPublishedNews(articles = [], { limit, now = Date.now() } = {}) {
  const visible = articles.filter((article) => isPublishedNews(article, now)).sort((a, b) => (
    Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    || new Date(b.publishedAt) - new Date(a.publishedAt)
    || a.id.localeCompare(b.id)
  ));
  return Number.isInteger(limit) && limit >= 0 ? visible.slice(0, limit) : visible;
}

export function validateNewsInput(input = {}) {
  const value = {
    title: String(input.title ?? "").trim(),
    category: String(input.category ?? "").trim() || "Actualidad",
    excerpt: String(input.excerpt ?? "").trim(),
    body: String(input.body ?? "").replace(/\r\n?/g, "\n").trim(),
    coverPath: String(input.coverPath ?? "").trim(),
    featured: Boolean(input.featured),
    publish: Boolean(input.publish),
  };
  if (!value.title) return { error: "Añade un título para guardar la noticia." };
  if (value.title.length > 180 || value.category.length > 80 || value.excerpt.length > 420 || value.body.length > 40_000) {
    return { error: "Revisa los límites: título 180, categoría 80, resumen 420 y cuerpo 40.000 caracteres." };
  }
  if (value.publish && (!value.excerpt || !value.body)) {
    return { error: "Completa el resumen y el cuerpo antes de publicar la noticia." };
  }
  if (value.coverPath && (value.coverPath.length > 2_000 || !safeNewsCover(value.coverPath))) {
    return { error: "La portada debe ser una URL HTTPS válida o la ruta de una imagen pública que empiece por /." };
  }
  return { value };
}

export function makeNewsSlug(title, suffix) {
  const base = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 72).replace(/-$/, "") || "noticia";
  return `${base}-${suffix}`;
}

// Editorial text is never interpreted as HTML. Only explicit HTTPS links become anchors.
export function splitNewsParagraph(paragraph) {
  return paragraph.split(/(https:\/\/[^\s<>"']+)/g).flatMap((part) => {
    if (!part.startsWith("https://")) return [{ text: part }];
    const candidate = part.replace(/[.,;!?)\]}]+$/, "");
    const href = safeNewsLink(candidate);
    if (!href) return [{ text: part }];
    return [{ text: candidate, href }, { text: part.slice(candidate.length) }].filter((token) => token.text);
  });
}
