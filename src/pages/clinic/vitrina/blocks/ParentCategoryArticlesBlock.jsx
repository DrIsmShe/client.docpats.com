// client/src/pages/clinic/vitrina/blocks/ParentCategoryArticlesBlock.jsx
//
// ВИТРИНА 2.0 (Часть 6) — блок страницы РОДИТЕЛЬСКОЙ категории.
// Показывает: плитки подкатегорий (ссылки) + карточки ВСЕХ статей всех
// подкатегорий вместе. Каждая карточка помечена своей подкатегорией.
//
// Данные: getPublicParentArticles(slug, pageSlug) → { articles, subcategories }.
// Если у страницы нет подкатегорий (это не родитель) → блок не рендерится
// (обычную категорию покажет categoryArticles).
//
// Контракт: ({ clinic, config }). config.title — заголовок секции.

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
import { getPublicParentArticles } from "../../../../api/clinic";

const CSS = `
.vt-pca-subs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
.vt-pca-sub { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 999px; background: var(--v-surface-alt); border: 1px solid var(--v-border); color: var(--v-text); text-decoration: none; font-size: 14px; font-weight: 600; transition: all .15s; }
.vt-pca-sub:hover { background: var(--v-primary); color: #fff; border-color: var(--v-primary); }
.vt-pca-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.vt-pca-card { display: flex; flex-direction: column; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; transition: transform .2s, box-shadow .2s; }
.vt-pca-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,.1); }
.vt-pca-cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--v-surface-alt); }
.vt-pca-body { padding: 16px 18px; display: flex; flex-direction: column; flex: 1; }
.vt-pca-cat { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--v-primary); margin-bottom: 7px; }
.vt-pca-title { font-family: var(--v-font-heading); font-size: 17px; font-weight: 600; color: var(--v-text); line-height: 1.3; margin-bottom: 8px; }
.vt-pca-excerpt { font-size: 14px; color: var(--v-text-muted); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
.vt-pca-meta { display: flex; gap: 10px; align-items: center; margin-top: 12px; font-size: 12px; color: var(--v-text-muted); }
.vt-pca-empty { padding: 40px; text-align: center; color: var(--v-text-muted); }
`;

export default function ParentCategoryArticlesBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params.slug || clinic?.slug || "";
  const pageSlug = params.pageSlug || "";
  // Путь берём из роутера, а не из window: при переходе внутри SPA window
  // обновится, но компонент об этом не узнает — база осталась бы от прошлой
  // страницы. Соседние блоки витрины уже читают useLocation.
  const location = useLocation();
  const base = clinicBasePath(location.pathname, slug);

  const [data, setData] = useState({ articles: [], subcategories: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!slug || !pageSlug) {
      setLoaded(true);
      return undefined;
    }
    getPublicParentArticles(slug, pageSlug)
      .then((res) => {
        if (!alive) return;
        setData({
          articles: Array.isArray(res?.articles) ? res.articles : [],
          subcategories: Array.isArray(res?.subcategories)
            ? res.subcategories
            : [],
        });
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [slug, pageSlug]);

  if (!pageSlug) return null;
  // не родитель (нет подкатегорий) → не рендерим, обычную категорию покажет categoryArticles
  if (loaded && data.subcategories.length === 0) return null;

  const title =
    config.title ||
    t("publicPage.parentArticlesTitle", { defaultValue: "Все статьи" });

  return (
    <Section bg={blockBgStyle(config)} title={title}>
      <style>{CSS}</style>

      {/* плитки подкатегорий */}
      {data.subcategories.length > 0 && (
        <div className="vt-pca-subs">
          {data.subcategories.map((s) => (
            <Link className="vt-pca-sub" to={`${base}/dp/${s.slug}`} key={s.id}>
              {s.title}
            </Link>
          ))}
        </div>
      )}

      {/* все статьи подкатегорий */}
      {data.articles.length > 0 ? (
        <div className="vt-pca-grid">
          {data.articles.map((a) => {
            const cover = resolveUrl(a.cover);
            const to = `${base}/dp/${a.categorySlug}/articles/${a.slug}`;
            return (
              <Link
                className="vt-pca-card"
                to={to}
                key={a.slug + a.categorySlug}
              >
                {cover && (
                  <img className="vt-pca-cover" src={cover} alt={a.title} />
                )}
                <div className="vt-pca-body">
                  {a.categoryTitle && (
                    <div className="vt-pca-cat">{a.categoryTitle}</div>
                  )}
                  <div className="vt-pca-title">{a.title}</div>
                  {a.excerpt && (
                    <div className="vt-pca-excerpt">{a.excerpt}</div>
                  )}
                  <div className="vt-pca-meta">
                    {a.authors && <span>{a.authors}</span>}
                    {a.createdAt && <span>{formatDate(a.createdAt)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="vt-pca-empty">
          {t("publicPage.parentNoArticles", {
            defaultValue: "В подкатегориях пока нет статей.",
          })}
        </div>
      )}
    </Section>
  );
}
