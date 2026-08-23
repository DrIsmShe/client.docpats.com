// client/src/pages/clinic/vitrina/ArticleDetailRenderer.jsx
//
// ВИТРИНА 2.0 (Часть 3) — рендер ДЕТЕЙЛА статьи:
//   /clinics/:slug/dp/:pageSlug/articles/:articleSlug
//
// Та же тема и chrome (topbar/nav/footer), что у витрины/кастомных страниц.
// Контент статьи: обложка, заголовок, авторы/дата, rich-text body (HTML).
//
// body — это доверенный HTML из rich-text редактора клиники (тот же поток, что
// научные статьи проекта). Выводим через dangerouslySetInnerHTML, как и в
// существующих статьях. (Серверная санитизация — на бэке, при сохранении.)
//
// Хлебная крошка ведёт назад в категорию (article.category.slug).

import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVitrinaTheme } from "./theme/useVitrinaTheme.js";
import { getBlockComponent } from "./blocks/blockRegistry.js";
import {
  RTL_LANGS,
  resolveUrl,
  formatDate,
  clinicBasePath,
} from "./lib/utils.js";
import Lightbox from "./components/Lightbox.jsx";
import { sh } from "../../../lib/sanitizeHtml";

const CHROME_TOP = new Set(["topbar", "nav"]);

const ART_CSS = `
.vt-art { min-height: 100vh; }
.vt-art-main { max-width: 820px; margin: 0 auto; padding: 28px 24px 64px; font-family: var(--v-font-body); color: var(--v-text); }
.vt-art-crumbs { font-size: 13px; color: var(--v-text-muted); margin-bottom: 18px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.vt-art-crumbs a { color: var(--v-primary); text-decoration: none; }
.vt-art-crumbs a:hover { text-decoration: underline; }
.vt-art-cover { width: 100%; max-height: 420px; object-fit: cover; border-radius: 14px; background: var(--v-surface-alt); display: block; margin-bottom: 24px; }
.vt-art-title { font-family: var(--v-font-heading); font-size: clamp(26px, 4vw, 40px); font-weight: 700; line-height: 1.18; color: var(--v-text); margin: 0 0 12px; }
.vt-art-meta { display: flex; gap: 14px; font-size: 13px; color: var(--v-text-muted); margin-bottom: 26px; flex-wrap: wrap; }
.vt-art-body { font-size: 16px; line-height: 1.75; color: var(--v-text); }
.vt-art-body h2 { font-family: var(--v-font-heading); font-size: 24px; margin: 28px 0 12px; }
.vt-art-body h3 { font-family: var(--v-font-heading); font-size: 20px; margin: 22px 0 10px; }
.vt-art-body p { margin: 0 0 16px; }
.vt-art-body ul, .vt-art-body ol { margin: 0 0 16px; padding-inline-start: 24px; }
.vt-art-body li { margin-bottom: 6px; }
.vt-art-body img { max-width: 100%; height: auto; border-radius: 10px; margin: 16px 0; }
.vt-art-body a { color: var(--v-primary); }
.vt-art-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
.vt-art-body th, .vt-art-body td { border: 1px solid var(--v-border); padding: 8px 10px; text-align: start; }
.vt-art-links { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--v-border); font-size: 14px; color: var(--v-text-muted); word-break: break-word; }
.vt-art-tags { margin-top: 18px; display: flex; gap: 8px; flex-wrap: wrap; }
.vt-art-tag { font-size: 12px; color: var(--v-text-muted); background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 999px; padding: 3px 12px; }
.vt-art-gallery { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.vt-art-gcell { position: relative; cursor: pointer; border-radius: 10px; overflow: hidden; background: var(--v-surface-alt); aspect-ratio: 4 / 3; border: 1px solid var(--v-border); }
.vt-art-gcell img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.vt-art-gcell:hover img { transform: scale(1.05); }
.vt-art-gcap { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px 10px 8px; font-size: 12px; font-weight: 600; color: #fff; background: linear-gradient(180deg, transparent, rgba(0,0,0,.65)); }
`;

export default function ArticleDetailRenderer({ clinic, article }) {
  const { i18n, t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const rootStyle = useVitrinaTheme(clinic?.theme);
  const slug = params.slug || clinic?.slug || "";

  const gallery = Array.isArray(article?.gallery) ? article.gallery : [];
  const [lbIndex, setLbIndex] = useState(null);
  const lbClose = useCallback(() => setLbIndex(null), []);
  const lbPrev = useCallback(
    () =>
      setLbIndex((i) =>
        i === null ? null : (i - 1 + gallery.length) % gallery.length,
      ),
    [gallery.length],
  );
  const lbNext = useCallback(
    () => setLbIndex((i) => (i === null ? null : (i + 1) % gallery.length)),
    [gallery.length],
  );

  // SEO статьи
  const clinicName = clinic?.name || "";
  const title = article?.title || "";
  const metaDesc = article?.metaDescription || article?.excerpt || "";
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prev = document.title;
    if (title) {
      document.title = clinicName ? `${title} — ${clinicName}` : title;
    }
    if (metaDesc) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", metaDesc);
    }
    return () => {
      document.title = prev;
    };
  }, [title, metaDesc, clinicName]);

  if (!clinic || !article) return null;

  const isRTL = RTL_LANGS.includes(i18n?.language);

  const vitrinaBlocks = Array.isArray(clinic.layout?.blocks)
    ? clinic.layout.blocks.filter((b) => b && b.visible !== false)
    : [];
  const topChrome = vitrinaBlocks
    .filter((b) => CHROME_TOP.has(b.type))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const footer = vitrinaBlocks.filter((b) => b.type === "footer");

  const renderBlock = (block, idx) => {
    const Component = getBlockComponent(block.type);
    if (!Component) return null;
    const key = block.id || `${block.type}-${block.order ?? idx}`;
    return <Component key={key} clinic={clinic} config={block.config || {}} />;
  };

  const cover = resolveUrl(article.cover);
  const cat = article.category || null;
  // Базу берём из текущего адреса, а не собираем из /clinics/<slug>:
  // витрина живёт по двум адресам, и корневой — канонический. Жёсткая база
  // перебрасывала посетителя с /<slug> на /clinics/<slug> посреди визита.
  const catHref = cat?.slug
    ? `${clinicBasePath(location.pathname, slug)}/dp/${cat.slug}`
    : null;

  return (
    <div
      className="vitrina-root vt-art"
      dir={isRTL ? "rtl" : "ltr"}
      style={rootStyle}
    >
      <style>{ART_CSS}</style>

      {topChrome.map(renderBlock)}

      <main className="vt-art-main">
        {/* хлебные крошки → назад в категорию */}
        {catHref && (
          <nav className="vt-art-crumbs">
            <Link to={catHref}>← {cat.title || cat.slug}</Link>
          </nav>
        )}

        {cover && <img className="vt-art-cover" src={cover} alt={title} />}

        <h1 className="vt-art-title">{title}</h1>

        <div className="vt-art-meta">
          {article.authors && <span>{article.authors}</span>}
          {article.createdAt && (
            <span>{formatDate(article.createdAt, i18n?.language)}</span>
          )}
        </div>

        {/* rich-text контент */}
        <div
          className="vt-art-body"
          dangerouslySetInnerHTML={{ __html: sh(article.body || "") }}
        />

        {/* галерея статьи */}
        {gallery.length > 0 && (
          <div className="vt-art-gallery">
            {gallery.map((g, i) => (
              <div
                className="vt-art-gcell"
                key={i}
                onClick={() => setLbIndex(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setLbIndex(i)}
              >
                <img
                  src={resolveUrl(g.image)}
                  alt={g.caption || ""}
                  loading="lazy"
                />
                {g.caption && <div className="vt-art-gcap">{g.caption}</div>}
              </div>
            ))}
          </div>
        )}

        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="vt-art-tags">
            {article.tags.map((tag, i) => (
              <span className="vt-art-tag" key={i}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {article.links && (
          <div className="vt-art-links">
            {t("publicPage.articleLinks", { defaultValue: "Источники:" })}{" "}
            {article.links}
          </div>
        )}
      </main>

      <Lightbox
        items={gallery}
        index={lbIndex}
        onClose={lbClose}
        onPrev={lbPrev}
        onNext={lbNext}
      />

      {footer.map(renderBlock)}
    </div>
  );
}
