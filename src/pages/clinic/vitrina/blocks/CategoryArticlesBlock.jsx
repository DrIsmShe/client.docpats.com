// client/src/pages/clinic/vitrina/blocks/CategoryArticlesBlock.jsx
//
// ВИТРИНА 2.0 (Часть 3) — блок «Статьи категории».
// Выводит карточки статей, привязанных к ТЕКУЩЕЙ странице-категории
// (/clinics/:slug/dp/:pageSlug). Клик по заголовку → детейл статьи:
//   /clinics/:slug/dp/:pageSlug/articles/:articleSlug
//
// Данные грузятся блоком САМ (статьи не в clinic DTO): по slug клиники + pageSlug
// из URL через getPublicCategoryArticles. Если страница не категория (нет
// pageSlug) или статей нет — блок не рендерится.
//
// Контракт: ({ clinic, config }).
//   config.title — заголовок секции (по умолчанию «Статьи»)

import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import {
  blockBgStyle,
  resolveUrl,
  formatDate,
  clinicBasePath,
} from "../lib/utils.js";
import { getPublicCategoryArticles } from "../../../../api/clinic";

const CSS = `
.vt-cat-articles { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.vt-cat-art { display: flex; flex-direction: column; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 12px; overflow: hidden; transition: box-shadow .2s, border-color .2s, transform .2s; }
.vt-cat-art:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); border-color: var(--v-primary); transform: translateY(-3px); }
.vt-cat-art-img { width: 100%; height: 160px; object-fit: cover; background: var(--v-surface-alt); display: block; }
.vt-cat-art-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.vt-cat-art-title { font-family: var(--v-font-heading); font-size: 16px; font-weight: 600; line-height: 1.35; color: var(--v-text); text-decoration: none; }
.vt-cat-art-title:hover { color: var(--v-primary); }
.vt-cat-art-excerpt { font-size: 13px; color: var(--v-text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.vt-cat-art-meta { display: flex; gap: 12px; font-size: 12px; color: var(--v-text-muted); margin-top: 2px; flex-wrap: wrap; }
.vt-cat-art-ph { width: 100%; height: 160px; background: var(--v-surface-alt); display: flex; align-items: center; justify-content: center; font-size: 32px; opacity: .35; }
`;

export default function CategoryArticlesBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const slug = params.slug || clinic?.slug || "";
  const pageSlug = params.pageSlug || ""; // присутствует только на /dp/:pageSlug

  const [articles, setArticles] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!slug || !pageSlug) {
      setLoaded(true);
      return undefined;
    }
    getPublicCategoryArticles(slug, pageSlug)
      .then((res) => {
        if (!alive) return;
        setArticles(Array.isArray(res?.items) ? res.items : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setArticles([]);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [slug, pageSlug]);

  // не категория или ещё не загрузилось без статей → не мешаем
  if (!pageSlug) return null;
  if (loaded && articles.length === 0) return null;

  const title =
    config.title ||
    t("publicPage.categoryArticlesTitle", { defaultValue: "Статьи" });

  // Базу берём из текущего адреса, а не собираем из /clinics/<slug>:
  // витрина живёт по двум адресам, и корневой — канонический. Жёсткая база
  // перебрасывала посетителя с /<slug> на /clinics/<slug> посреди визита.
  const base = `${clinicBasePath(
    location.pathname,
    slug,
  )}/dp/${pageSlug}/articles`;

  return (
    <Section bg={blockBgStyle(config)} id="articles" title={title}>
      <style>{CSS}</style>
      <div className="vt-cat-articles">
        {articles.map((a) => {
          const img = resolveUrl(a.cover);
          const to = `${base}/${a.slug}`;
          return (
            <article className="vt-cat-art" key={a.slug}>
              <Link to={to} aria-label={a.title}>
                {img ? (
                  <img className="vt-cat-art-img" src={img} alt={a.title} />
                ) : (
                  <div className="vt-cat-art-ph">📄</div>
                )}
              </Link>
              <div className="vt-cat-art-body">
                <Link className="vt-cat-art-title" to={to}>
                  {a.title}
                </Link>
                {a.excerpt && <p className="vt-cat-art-excerpt">{a.excerpt}</p>}
                <div className="vt-cat-art-meta">
                  {a.authors && <span>{a.authors}</span>}
                  {a.createdAt && (
                    <span>{formatDate(a.createdAt, i18n?.language)}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
