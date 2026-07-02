// client/src/pages/clinic/vitrina/CustomPageRenderer.jsx
//
// ВИТРИНА 2.0 (Часть 2) — рендер КАСТОМНОЙ страницы (/clinics/:slug/dp/:pageSlug).
//
// Отличие от VitrinaRenderer: тот рендерит витрину клиники и её разделы
// (по layout.blocks + :section). Здесь рендерим произвольный набор блоков
// КОНКРЕТНОЙ страницы (page.layout.blocks) в контексте темы и данных клиники.
//
// Chrome (topbar/nav/footer) берём из ВИТРИНЫ клиники — чтобы у кастомной
// страницы было единое меню и подвал. Контент-блоки страницы рендерятся между
// верхним chrome и footer'ом.
//
// Блокам передаётся `clinic` (источник данных: доктора/отзывы/контакты) и их
// собственный `config`.

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useVitrinaTheme } from "./theme/useVitrinaTheme.js";
import { getBlockComponent } from "./blocks/blockRegistry.js";
import { RTL_LANGS, resolveUrl } from "./lib/utils.js";

const CHROME_TOP = new Set(["topbar", "nav"]);

const PAGE_CSS = `
.vt-cpage { min-height: 100vh; }
.vt-cpage-main { max-width: var(--v-content-max, 1040px); margin: 0 auto; }
.vt-cpage-empty { max-width: 760px; margin: 0 auto; padding: 80px 24px; text-align: center; color: var(--v-text-muted); font-family: var(--v-font-body); }
`;

// Фон всей страницы (копия логики VitrinaRenderer.pageBackgroundStyle).
function pageBackgroundStyle(theme, clinic) {
  const style = theme?.pageBgStyle || "none";
  const cfg = theme?.pageBg || {};

  if (style === "gradient" && cfg.background) {
    return { background: cfg.background };
  }
  if (style === "photo") {
    const url = resolveUrl(clinic?.pageBackground);
    if (!url) return {};
    const dim = Number.isFinite(clinic?.theme?.pageBgDim)
      ? clinic.theme.pageBgDim
      : 85;
    let layers = `url(${url})`;
    if (dim > 0) {
      const top = Math.min(92, dim);
      const bottom = Math.min(96, dim + 6);
      const overlay =
        `linear-gradient(180deg,` +
        ` color-mix(in srgb, var(--v-bg) ${top}%, transparent) 0%,` +
        ` color-mix(in srgb, var(--v-bg) ${bottom}%, transparent) 100%)`;
      layers = `${overlay}, url(${url})`;
    }
    return {
      backgroundImage: layers,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      ...(cfg.fixed ? { backgroundAttachment: "fixed" } : {}),
    };
  }
  return {};
}

/**
 * @param {Object} clinic публичный DTO клиники (тема, доктора, контакты, layout)
 * @param {Object} page   { slug, title, seo, layout:{blocks} }
 */
export default function CustomPageRenderer({ clinic, page }) {
  const { i18n } = useTranslation();
  const rootStyle = useVitrinaTheme(clinic?.theme);

  // SEO кастомной страницы (document.title + meta description).
  const seo = page?.seo || null;
  const clinicName = clinic?.name || "";
  const pageTitle = page?.title || "";
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prevTitle = document.title;
    const titleText = seo?.title || pageTitle;
    if (titleText) {
      document.title = clinicName ? `${titleText} — ${clinicName}` : titleText;
    }
    if (seo?.description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", seo.description);
    }
    return () => {
      document.title = prevTitle;
    };
  }, [seo, pageTitle, clinicName]);

  if (!clinic || !page) return null;

  const isRTL = RTL_LANGS.includes(i18n?.language);
  const bgStyle = pageBackgroundStyle(clinic.theme, clinic);

  // chrome из витрины клиники
  const vitrinaBlocks = Array.isArray(clinic.layout?.blocks)
    ? clinic.layout.blocks.filter((b) => b && b.visible !== false)
    : [];
  const topChrome = vitrinaBlocks
    .filter((b) => CHROME_TOP.has(b.type))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const footer = vitrinaBlocks.filter((b) => b.type === "footer");

  // блоки самой кастомной страницы
  const pageBlocks = Array.isArray(page.layout?.blocks)
    ? page.layout.blocks
        .filter((b) => b && b.type && b.visible !== false)
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  // АВТОПОКАЗ СТАТЕЙ И ГАЛЕРЕИ: если работник не добавил блоки вручную,
  // дорисовываем их автоматически в конце. Блоки сами грузят данные и прячутся,
  // если их нет — пустую категорию это не засорит. Так сотруднику не нужно
  // возиться с конструктором: создал статьи/фото → они сразу видны.
  const hasArticlesBlock = pageBlocks.some(
    (b) => b.type === "categoryArticles",
  );
  const hasGalleryBlock = pageBlocks.some((b) => b.type === "categoryGallery");
  const hasParentBlock = pageBlocks.some(
    (b) => b.type === "parentCategoryArticles",
  );
  const autoBlocks = [];
  // агрегат родителя — выше: сам прячется, если у страницы нет подкатегорий
  if (!hasParentBlock)
    autoBlocks.push({
      type: "parentCategoryArticles",
      config: {},
      _auto: true,
    });
  if (!hasArticlesBlock)
    autoBlocks.push({ type: "categoryArticles", config: {}, _auto: true });
  if (!hasGalleryBlock)
    autoBlocks.push({ type: "categoryGallery", config: {}, _auto: true });
  const blocksToRender = [...pageBlocks, ...autoBlocks];

  const renderBlock = (block, idx) => {
    const Component = getBlockComponent(block.type);
    if (!Component) return null;
    const key = block.id || `${block.type}-${block.order ?? idx}`;
    return <Component key={key} clinic={clinic} config={block.config || {}} />;
  };

  return (
    <div
      className="vitrina-root vt-cpage"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ ...rootStyle, ...bgStyle }}
    >
      <style>{PAGE_CSS}</style>

      {topChrome.map(renderBlock)}

      <main className="vt-cpage-main">{blocksToRender.map(renderBlock)}</main>

      {footer.map(renderBlock)}
    </div>
  );
}
