// client/src/pages/clinic/vitrina/blocks/CategoryGalleryBlock.jsx
//
// ВИТРИНА 2.0 (Часть 4) — блок «Галерея категории».
// Сетка превью фото текущей страницы-категории (/dp/:pageSlug) + лайтбокс
// (полноэкранный просмотр со стрелками ←/→, Esc, подпись и описание).
//
// Данные грузит сам по slug+pageSlug из URL (getPublicCategoryGallery).
// Нет pageSlug или нет фото → блок не рендерится.
//
// Контракт: ({ clinic, config }).  config.title — заголовок секции.

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle, resolveUrl } from "../lib/utils.js";
import { getPublicCategoryGallery } from "../../../../api/clinic";

const CSS = `
.vt-cgal { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.vt-cgal-cell { position: relative; cursor: pointer; border-radius: 12px; overflow: hidden; background: var(--v-surface-alt); aspect-ratio: 4 / 3; border: 1px solid var(--v-border); }
.vt-cgal-cell img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
.vt-cgal-cell:hover img { transform: scale(1.05); }
.vt-cgal-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 12px 9px; font-size: 13px; font-weight: 600; color: #fff; background: linear-gradient(180deg, transparent, rgba(0,0,0,.65)); font-family: var(--v-font-body); }

/* лайтбокс */
.vt-lb { position: fixed; inset: 0; z-index: 1000; background: rgba(10,10,12,.94); display: flex; align-items: center; justify-content: center; padding: 24px; }
.vt-lb-stage { max-width: 1100px; width: 100%; max-height: 100%; display: flex; flex-direction: column; align-items: center; }
.vt-lb-imgwrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; width: 100%; }
.vt-lb-img { max-width: 100%; max-height: 72vh; object-fit: contain; border-radius: 8px; }
.vt-lb-meta { width: 100%; max-width: 900px; color: #fff; text-align: center; margin-top: 16px; font-family: var(--v-font-body); }
.vt-lb-cap { font-family: var(--v-font-heading); font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.vt-lb-desc { font-size: 14px; line-height: 1.6; color: #d4d4d8; white-space: pre-wrap; }
.vt-lb-count { font-size: 12px; color: #a1a1aa; margin-top: 10px; font-family: var(--v-font-body); }
.vt-lb-close { position: fixed; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%; border: none; background: rgba(255,255,255,.14); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.vt-lb-close:hover { background: rgba(255,255,255,.26); }
.vt-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(255,255,255,.14); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.vt-lb-nav:hover { background: rgba(255,255,255,.26); }
.vt-lb-prev { left: 20px; }
.vt-lb-next { right: 20px; }
@media (max-width: 600px) {
  .vt-lb-nav { width: 40px; height: 40px; font-size: 20px; }
  .vt-lb-prev { left: 8px; } .vt-lb-next { right: 8px; }
}
`;

export default function CategoryGalleryBlock({ clinic, config = {} }) {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params.slug || clinic?.slug || "";
  const pageSlug = params.pageSlug || "";

  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(null); // индекс открытого фото | null

  useEffect(() => {
    let alive = true;
    if (!slug || !pageSlug) {
      setLoaded(true);
      return undefined;
    }
    getPublicCategoryGallery(slug, pageSlug)
      .then((res) => {
        if (!alive) return;
        setItems(Array.isArray(res?.items) ? res.items : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [slug, pageSlug]);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(
    () =>
      setActive((i) =>
        i === null ? null : (i - 1 + items.length) % items.length,
      ),
    [items.length],
  );
  const next = useCallback(
    () => setActive((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );

  // клавиатура в лайтбоксе
  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    // блокируем скролл фона
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, prev, next]);

  if (!pageSlug) return null;
  if (loaded && items.length === 0) return null;

  const title =
    config.title ||
    t("publicPage.categoryGalleryTitle", { defaultValue: "Галерея" });

  const cur = active !== null ? items[active] : null;

  return (
    <Section bg={blockBgStyle(config)} id="gallery" title={title}>
      <style>{CSS}</style>
      <div className="vt-cgal">
        {items.map((it, i) => {
          const img = resolveUrl(it.image);
          return (
            <div
              className="vt-cgal-cell"
              key={it.id || i}
              onClick={() => setActive(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActive(i)}
            >
              <img src={img} alt={it.caption || ""} loading="lazy" />
              {it.caption && <div className="vt-cgal-cap">{it.caption}</div>}
            </div>
          );
        })}
      </div>

      {cur && (
        <div
          className="vt-lb"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            type="button"
            className="vt-lb-close"
            onClick={close}
            aria-label={t("common:a11y.close")}
          >
            ✕
          </button>
          {items.length > 1 && (
            <>
              <button
                type="button"
                className="vt-lb-nav vt-lb-prev"
                onClick={prev}
                aria-label={t("common:a11y.prev")}
              >
                ‹
              </button>
              <button
                type="button"
                className="vt-lb-nav vt-lb-next"
                onClick={next}
                aria-label={t("common:a11y.next")}
              >
                ›
              </button>
            </>
          )}
          <div className="vt-lb-stage">
            <div className="vt-lb-imgwrap">
              <img
                className="vt-lb-img"
                src={resolveUrl(cur.image)}
                alt={cur.caption || ""}
              />
            </div>
            {(cur.caption || cur.description) && (
              <div className="vt-lb-meta">
                {cur.caption && <div className="vt-lb-cap">{cur.caption}</div>}
                {cur.description && (
                  <div className="vt-lb-desc">{cur.description}</div>
                )}
              </div>
            )}
            {items.length > 1 && (
              <div className="vt-lb-count">
                {active + 1} / {items.length}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
