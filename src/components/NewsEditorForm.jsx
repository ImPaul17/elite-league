import { useRef, useState } from "react";
import { useLeague } from "../context/LeagueContext";
import { formatNewsDate, isPublishedNews } from "../lib/news";
import { AppLink, EmptyState } from "./ui";
import { NewsBody, NewsCover } from "./NewsContent";
import "./news.css";

const blankForm = () => ({ title: "", category: "Actualidad", excerpt: "", body: "", coverPath: "", featured: false });
const articleForm = (article) => article ? {
  title: article.title ?? "", category: article.category ?? "Actualidad", excerpt: article.excerpt ?? "",
  body: article.body ?? "", coverPath: article.coverPath ?? "", featured: Boolean(article.featured),
} : blankForm();

export function NewsEditorForm() {
  const { league, viewer, saveNews, isDemoMode } = useLeague();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(blankForm);
  const [savedForm, setSavedForm] = useState(() => JSON.stringify(blankForm()));
  const [filter, setFilter] = useState("all");
  const [pendingSelection, setPendingSelection] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const titleRef = useRef(null);
  const articles = viewer?.role === "admin" ? league.adminNews ?? [] : [];
  const selectedArticle = articles.find((article) => article.id === selectedId);
  const isPublished = isPublishedNews(selectedArticle);
  const dirty = savedForm !== JSON.stringify(form);
  const filtered = articles.filter((article) => filter === "all" || (filter === "published" ? isPublishedNews(article) : !isPublishedNews(article)));

  if (viewer?.role !== "admin") return null;

  function edit(article) {
    const next = articleForm(article);
    setSelectedId(article?.id ?? "");
    setForm(next);
    setSavedForm(JSON.stringify(next));
    setPendingSelection(null);
    setError("");
    setFeedback("");
    titleRef.current?.focus();
  }

  function selectArticle(article) {
    if (savingRef.current) return;
    if (dirty) setPendingSelection({ article });
    else edit(article);
  }

  function change(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setFeedback("");
  }

  async function submit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    const intent = event.nativeEvent.submitter?.value ?? (isPublished ? "save" : "draft");
    savingRef.current = true;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const result = await saveNews({ ...form, articleId: selectedId || undefined, publish: intent === "publish" || (intent === "save" && isPublished) });
      if (!result.ok) { setError(result.error); return; }
      const next = articleForm(result.article);
      setSelectedId(result.article.id);
      setForm(next);
      setSavedForm(JSON.stringify(next));
      setFeedback(result.warning || (result.article.publishedAt ? "Noticia publicada. Los cambios ya están guardados." : "Borrador guardado. No aparece en Inicio, Noticias ni en su enlace público."));
    } catch (failure) {
      setError(failure?.message ?? "No se ha podido guardar la noticia. Inténtalo de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <div className="news-workspace">
    {isDemoMode && <p className="news-editor-help">Demostración local: estos cambios no se publican ni se conservan al recargar.</p>}
    <div className="news-manager-toolbar">
      <label>Ver publicaciones<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todas ({articles.length})</option><option value="published">Publicadas</option><option value="draft">Borradores</option></select></label>
      <button className="button button-outline button-small" type="button" onClick={() => selectArticle(null)} disabled={saving}>Nueva noticia</button>
    </div>
    {pendingSelection && <div className="news-unsaved" role="alert">
      <p>Hay cambios sin guardar. ¿Quieres descartarlos para abrir {pendingSelection.article ? "otra noticia" : "una noticia nueva"}?</p>
      <div className="news-editor-actions"><button className="button button-outline button-small" type="button" onClick={() => setPendingSelection(null)}>Seguir editando</button><button className="button button-outline button-small" type="button" onClick={() => edit(pendingSelection.article)}>Descartar cambios</button></div>
    </div>}
    {filtered.length ? <ul className="news-management-list">{filtered.map((article) => <li key={article.id} className={selectedId === article.id ? "is-selected" : ""}>
      <div><strong>{article.title}</strong><span>{isPublishedNews(article) ? `Publicada · ${formatNewsDate(article.publishedAt)}` : "Borrador"}{article.featured ? " · Destacada" : ""}</span></div>
      <button className="button button-outline button-small" type="button" onClick={() => selectArticle(article)} disabled={saving} aria-label={`Editar: ${article.title}`}>Editar</button>
    </li>)}</ul> : <EmptyState title={articles.length ? "No hay noticias en este estado" : "Aún no hay noticias creadas"} description="Puedes preparar un borrador y publicarlo cuando el contenido esté confirmado." />}
    <form className="news-editor-form news-editor-complete" onSubmit={submit} aria-busy={saving}>
      <div className="news-editor-heading"><h3>{selectedId ? "Editar noticia" : "Nueva noticia"}</h3><span>{isPublished ? "Publicada" : "Borrador"}{dirty ? " · Cambios sin guardar" : ""}</span></div>
      <fieldset disabled={saving}>
        <label>Título<input ref={titleRef} value={form.title} onChange={(event) => change("title", event.target.value)} placeholder="Titular de la noticia" maxLength={180} required /></label>
        <label>Categoría<input value={form.category} onChange={(event) => change("category", event.target.value)} maxLength={80} /></label>
        <label className="news-editor-wide">Resumen<textarea value={form.excerpt} onChange={(event) => change("excerpt", event.target.value)} placeholder="Texto que aparecerá en Inicio y en el listado" rows={3} maxLength={420} /><small>{form.excerpt.length}/420 caracteres</small></label>
        <label className="news-editor-wide">Cuerpo de la noticia<textarea value={form.body} onChange={(event) => change("body", event.target.value)} placeholder="Escribe el artículo completo. Separa los párrafos con una línea en blanco." rows={12} maxLength={40000} aria-describedby="news-body-help" /></label>
        <p id="news-body-help" className="news-editor-help news-editor-wide">Para incluir el tráiler, pega su enlace HTTPS en el cuerpo. Se abrirá en otra pestaña. El texto conserva párrafos y saltos de línea; no admite código HTML.</p>
        <label className="news-editor-wide">Portada (opcional)<input value={form.coverPath} onChange={(event) => change("coverPath", event.target.value)} placeholder="https://… o /noticias/portada.png" maxLength={2000} aria-describedby="news-cover-help" /><small id="news-cover-help">Usa una imagen pública HTTPS o una imagen que ya esté incluida en la web. Este campo no sube archivos.</small></label>
        <label className="news-editor-featured"><input type="checkbox" checked={form.featured} onChange={(event) => change("featured", event.target.checked)} />Destacar en Inicio y Noticias</label>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p className="news-editor-feedback" role="status">{feedback}</p>}
      <div className="news-editor-actions">
        {isPublished ? <>
          <button className="button button-primary button-small" type="submit" value="save" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
          <button className="button button-outline button-small" type="submit" value="draft" disabled={saving}>Retirar y guardar borrador</button>
          <AppLink className="text-link" to={`/noticias/${selectedId}`}>Ver publicación →</AppLink>
        </> : <>
          <button className="button button-outline button-small" type="submit" value="draft" disabled={saving}>{saving ? "Guardando…" : "Guardar borrador"}</button>
          <button className="button button-primary button-small" type="submit" value="publish" disabled={saving}>Publicar noticia</button>
        </>}
      </div>
      <p className="news-editor-help">Publicar o guardar una noticia publicada aplica los cambios de inmediato. Retirarla conserva el contenido como borrador.</p>
      <details className="news-editor-preview"><summary>Vista previa del contenido</summary><article><p className="eyebrow">{form.category || "Actualidad"}</p><h2>{form.title || "Título de la noticia"}</h2><p className="article-lead">{form.excerpt}</p><NewsCover path={form.coverPath} title={form.title} /><NewsBody body={form.body} /></article></details>
    </form>
  </div>;
}
