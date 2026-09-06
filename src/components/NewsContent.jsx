import { useState } from "react";
import { AppLink } from "./ui";
import { formatNewsDate, safeNewsCover, splitNewsParagraph } from "../lib/news";
import "./news.css";

export function NewsCover({ path, title, className = "", eager = false }) {
  const src = safeNewsCover(path, import.meta.env.BASE_URL ?? "/");
  const [failedSource, setFailedSource] = useState("");
  if (!src) return null;
  return failedSource === src
    ? <div className={`news-cover news-cover-unavailable ${className}`}>Portada no disponible</div>
    : <img className={`news-cover ${className}`} src={src} alt={`Portada: ${title}`} loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" onError={() => setFailedSource(src)} />;
}

export function NewsBody({ body }) {
  const paragraphs = String(body ?? "").split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  return <div className="news-article-body">{paragraphs.map((paragraph, index) => (
    <p key={index}>{splitNewsParagraph(paragraph).map((part, partIndex) => part.href
      ? <a href={part.href} key={partIndex} target="_blank" rel="noopener noreferrer">{part.text}<span className="news-sr-only"> (abre en otra pestaña)</span></a>
      : <span key={partIndex}>{part.text}</span>)}</p>
  ))}</div>;
}

export function NewsCard({ article }) {
  return (
    <article className={`news-card news-public-card ${article.featured ? "is-featured" : ""}`}>
      <NewsCover path={article.coverPath} title={article.title} />
      <div className="news-public-card-content">
        <div className="news-card-mark"><span>{article.category}</span><time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time></div>
        <h3><AppLink to={`/noticias/${article.id}`}>{article.title}</AppLink></h3>
        <p>{article.excerpt}</p>
        <AppLink to={`/noticias/${article.id}`} className="text-link" aria-label={`Leer noticia: ${article.title}`}>Leer noticia →</AppLink>
      </div>
    </article>
  );
}
