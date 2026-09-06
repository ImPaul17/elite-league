import { AppLink, EmptyState, Notice, PageHero, SectionHeading } from "../components/ui";
import { NewsBody, NewsCard, NewsCover } from "../components/NewsContent";
import { useLeague } from "../context/LeagueContext";
import { formatNewsDate, getPublishedNews } from "../lib/news";

export function NewsPage({ articleId }) {
  const { league, dataStatus, reloadProductionLeague, viewer } = useLeague();
  const articles = getPublishedNews(league.news);
  const article = articleId ? articles.find((item) => item.id === articleId) : null;
  const retry = () => { reloadProductionLeague(viewer).catch(() => {}); };

  if (articleId) {
    return <>
      <AppLink to="/noticias" className="back-link">← Todas las noticias</AppLink>
      {article ? (
        <article className="article-page news-article reveal-item">
          <p className="eyebrow">{article.category} · <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time></p>
          <h1>{article.title}</h1>
          <p className="article-lead">{article.excerpt}</p>
          <NewsCover path={article.coverPath} title={article.title} eager />
          <NewsBody body={article.body} />
        </article>
      ) : dataStatus === "loading" ? <p role="status" className="news-loading">Cargando noticia…</p>
        : dataStatus === "error" ? <Notice tone="warning">No hemos podido comprobar esta noticia. <button className="text-link" onClick={retry}>Reintentar</button></Notice>
          : <section className="content-section"><EmptyState title="Noticia no disponible" description="El enlace no existe o la publicación se ha retirado." action={<AppLink to="/noticias" className="text-link">Ver noticias publicadas →</AppLink>} /></section>}
    </>;
  }
  return (
    <>
      <PageHero eyebrow="Actualidad" title="Noticias de Elite League" description="Comunicados, crónicas y novedades de la competición." />
      <section className="content-section reveal-item">
        <SectionHeading title="Últimas publicaciones" />
        {dataStatus === "error" && <Notice tone="warning">No se han podido actualizar las noticias. <button className="text-link" onClick={retry}>Reintentar</button></Notice>}
        {articles.length ? <div className="news-grid news-public-grid">{articles.map((item) => <NewsCard article={item} key={item.id} />)}</div>
          : dataStatus === "loading" ? <p role="status" className="news-loading">Cargando noticias…</p>
            : dataStatus !== "error" && <EmptyState title="Todavía no hay noticias publicadas" description="Los anuncios y novedades de Elite League aparecerán aquí." />}
      </section>
    </>
  );
}
