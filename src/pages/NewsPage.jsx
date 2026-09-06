import { AppLink, PageHero, SectionHeading } from "../components/ui";
import { useLeague } from "../context/LeagueContext";

export function NewsPage({ articleId }) {
  const { league } = useLeague();
  const article = articleId ? league.news.find((item) => item.id === articleId) : null;
  if (article) {
    return (
      <>
        <AppLink to="/noticias" className="back-link">← Todas las noticias</AppLink>
        <article className="article-page reveal-item">
          <p className="eyebrow">{article.category} · {article.date}</p>
          <h1>{article.title}</h1>
          <p className="article-lead">{article.excerpt}</p>
          <div className="article-visual"><span>Elite League</span></div>
          <p>Este espacio está preparado para las crónicas, comunicados, anuncios de jornada y contenido editorial de la competición. Desde el panel de administración se podrán crear, publicar y destacar noticias sin modificar código.</p>
        </article>
      </>
    );
  }
  return (
    <>
      <PageHero eyebrow="Actualidad" title="Noticias de Elite League" description="Comunicados oficiales, previa de jornadas, crónicas y toda la información de los clubes." />
      <section className="content-section reveal-item">
        <SectionHeading eyebrow="Reciente" title="Últimas publicaciones" />
        <div className="news-feed">
          {league.news.map((item) => <article className="news-feed-card" key={item.id}><div><span>{item.category}</span><small>{item.date}</small></div><h2>{item.title}</h2><p>{item.excerpt}</p><AppLink className="text-link" to={`/noticias/${item.id}`}>Leer noticia →</AppLink></article>)}
        </div>
      </section>
    </>
  );
}
