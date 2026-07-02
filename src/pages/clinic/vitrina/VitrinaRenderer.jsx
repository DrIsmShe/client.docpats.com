// client/src/pages/clinic/vitrina/VitrinaRenderer.jsx
//
// ВИТРИНА 2.0 — корневой рендерер. Лендинг + страницы разделов.
//
// Главная (/clinics/:slug): все блоки layout по порядку.
// Раздел (/clinics/:slug/:section): chrome (topbar/nav/footer) + блок раздела,
// плюс НАДСТРОЙКИ страницы из config блока (Путь 1):
//   pageBg      — фон страницы раздела (свой, поверх общего)
//   pageIntro   — { title, text } шапка над блоком (H1 + текст)
//   pageOutro   — текст под блоком
//   pageExtras  — массив типов доп. блоков снизу (из существующих layout):
//                 например ["cta","contacts"]
// Надстройки применяются ТОЛЬКО на странице раздела, на главную не влияют.

import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVitrinaTheme } from "./theme/useVitrinaTheme.js";
import { getBlockComponent } from "./blocks/blockRegistry.js";
import {
  RTL_LANGS,
  resolveUrl,
  typeForSectionSlug,
  blockBgStyle,
  telHref,
  resolveVitrinaLink,
} from "./lib/utils.js";

/**
 * Умная ссылка для кнопок/CTA: anchor → <a href="#..">, external → новый таб,
 * internal → <Link> (SPA-навигация). className пробрасывается.
 */
function SmartLink({ raw, base, className, children }) {
  const link = resolveVitrinaLink(raw, base);
  if (!link) {
    return <span className={className}>{children}</span>;
  }
  if (link.kind === "external") {
    const blank = /^https?:/i.test(link.href);
    return (
      <a
        className={className}
        href={link.href}
        {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  if (link.kind === "anchor") {
    return (
      <a className={className} href={link.href}>
        {children}
      </a>
    );
  }
  // internal — SPA-навигация
  return (
    <Link className={className} to={link.href}>
      {children}
    </Link>
  );
}

const CHROME_TYPES = new Set(["topbar", "nav", "footer"]);

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

const PAGE_CSS = `
.vt-page { --vp-pad: 48px; }
.vt-page--compact { --vp-pad: 28px; }
.vt-page--roomy { --vp-pad: 76px; }

.vt-page-banner { width: 100%; overflow: hidden; position: relative; }
.vt-page-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
.vt-page-banner--low { height: 180px; }
.vt-page-banner--mid { height: 300px; }
.vt-page-banner--high { height: 440px; }
.vt-page-banner--overlay::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 100%); }
.vt-page-banner-cap { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 24px; color: #fff; }
.vt-page-banner-cap.vt-cap--left { align-items: flex-start; text-align: left; padding-left: max(32px, calc((100% - var(--vp-max, var(--v-content-max, 1040px))) / 2 + 32px)); }
.vt-page-banner-cap h1 { font-family: var(--v-font-heading); font-size: clamp(30px, 5vw, 54px); font-weight: 700; margin: 0 0 12px; letter-spacing: -.01em; text-shadow: 0 2px 18px rgba(0,0,0,.35); }
.vt-page-banner-cap p { font-size: 17px; line-height: 1.6; max-width: 720px; margin: 0; text-shadow: 0 1px 10px rgba(0,0,0,.3); white-space: pre-line; }

.vt-page-intro { max-width: var(--vp-max, var(--v-content-max, 1040px)); margin: 0 auto; padding: var(--vp-pad) 32px 8px; text-align: center; }
.vt-page-intro--left { text-align: left; }
.vt-page-intro--light .vt-page-intro-title, .vt-page-intro--light .vt-page-intro-text { color: #fff; }
.vt-page-intro-title { font-family: var(--v-font-heading); font-size: clamp(30px, 5vw, 52px); font-weight: 700; color: var(--v-text); margin: 0 0 14px; letter-spacing: -.01em; }
.vt-page-intro-text { font-size: 17px; line-height: 1.7; color: var(--v-text-muted); max-width: 760px; margin: 0 auto; white-space: pre-line; }
.vt-page-intro--left .vt-page-intro-text { margin: 0; }

.vt-page-btns { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 22px; }
.vt-page-intro--left .vt-page-btns { justify-content: flex-start; }
.vt-page-btn { display: inline-flex; align-items: center; font-family: var(--v-font-body); font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 100px; text-decoration: none; transition: opacity .15s, transform .15s; }
.vt-page-btn:hover { transform: translateY(-1px); }
.vt-page-btn--primary { background: var(--v-primary); color: var(--v-on-primary); }
.vt-page-btn--ghost { background: transparent; color: var(--v-primary); border: 1.5px solid var(--v-primary); }

.vt-page-divider { max-width: var(--vp-max, var(--v-content-max, 1040px)); margin: 14px auto; height: 1px; background: var(--v-border); opacity: .7; }

.vt-page-cta { max-width: var(--vp-max, var(--v-content-max, 1040px)); margin: 0 auto; padding: 16px 32px; }
.vt-page-cta-card { background: var(--v-primary); color: var(--v-on-primary); border-radius: 18px; padding: 40px 36px; text-align: center; }
.vt-page-cta-card h3 { font-family: var(--v-font-heading); font-size: clamp(22px, 3vw, 32px); font-weight: 700; margin: 0 0 18px; }
.vt-page-cta-btn { display: inline-flex; align-items: center; background: var(--v-on-primary); color: var(--v-primary); font-family: var(--v-font-body); font-size: 16px; font-weight: 700; padding: 13px 30px; border-radius: 100px; text-decoration: none; }

.vt-page-outro { max-width: var(--vp-max, var(--v-content-max, 1040px)); margin: 0 auto; padding: 8px 32px var(--vp-pad); }
.vt-page-outro-card { background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 16px; padding: 28px 32px; font-size: 16px; line-height: 1.75; color: var(--v-text); white-space: pre-line; }
@media (max-width: 640px) {
  .vt-page-intro { padding: 28px 16px 4px; }
  .vt-page-outro { padding: 4px 16px 28px; }
  .vt-page-outro-card { padding: 20px; }
  .vt-page-banner--low { height: 130px; }
  .vt-page-banner--mid { height: 190px; }
  .vt-page-banner--high { height: 250px; }
  .vt-page-cta-card { padding: 28px 20px; }
}
`;

export default function VitrinaRenderer({ clinic }) {
  const { i18n } = useTranslation();
  const { section } = useParams();
  const rootStyle = useVitrinaTheme(clinic?.theme);

  // SEO под-страницы (document.title + meta description). Без зависимостей.
  const _allBlocks = Array.isArray(clinic?.layout?.blocks)
    ? clinic.layout.blocks
    : [];
  const _sectionType = section ? typeForSectionSlug(section) : null;
  const _sectionBlock = _sectionType
    ? _allBlocks.find((b) => b.type === _sectionType)
    : null;
  const _seo = _sectionBlock?.config?.pageSeo || null;
  const _clinicName = clinic?.name || "";
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prevTitle = document.title;
    if (_seo && (_seo.title || _seo.description)) {
      if (_seo.title) {
        document.title = _clinicName
          ? `${_seo.title} — ${_clinicName}`
          : _seo.title;
      }
      if (_seo.description) {
        let m = document.querySelector('meta[name="description"]');
        if (!m) {
          m = document.createElement("meta");
          m.setAttribute("name", "description");
          document.head.appendChild(m);
        }
        m.setAttribute("content", _seo.description);
      }
    }
    return () => {
      document.title = prevTitle;
    };
  }, [_seo, _clinicName]);

  if (!clinic) return null;

  const isRTL = RTL_LANGS.includes(i18n?.language);
  const allBlocks = Array.isArray(clinic.layout?.blocks)
    ? clinic.layout.blocks
    : [];

  const sectionType = section ? typeForSectionSlug(section) : null;
  const isSectionPage = Boolean(sectionType);

  const sectionBlock = isSectionPage
    ? allBlocks.find((b) => b.type === sectionType)
    : null;
  const pageCfg = sectionBlock?.config || {};

  // Синтетический блок раздела: если у клиники нет этого блока в layout
  // (например priceList — он не входит в фиксированный набор витрины), всё
  // равно рендерим раздел /clinics/:slug/<section>.
  const syntheticSectionBlock =
    isSectionPage && !sectionBlock
      ? { type: sectionType, order: 50, config: {}, _synthetic: true }
      : null;

  const blocks = isSectionPage
    ? [
        ...allBlocks.filter(
          (b) => CHROME_TYPES.has(b.type) || b.type === sectionType,
        ),
        ...(syntheticSectionBlock ? [syntheticSectionBlock] : []),
      ]
    : allBlocks;

  const bgStyle = pageBackgroundStyle(clinic.theme, clinic);

  // ── надстройки страницы раздела ─────────────────────────────────────────
  const pageIntro = isSectionPage ? pageCfg.pageIntro || null : null;
  const pageOutro = isSectionPage ? (pageCfg.pageOutro || "").trim() : "";
  const pageBg = isSectionPage
    ? blockBgStyle({ bg: pageCfg.pageBg, bgColor: pageCfg.pageBgColor })
    : { style: {}, hasBg: false };
  const extras =
    isSectionPage && Array.isArray(pageCfg.pageExtras)
      ? pageCfg.pageExtras
      : [];

  // косметика страницы раздела
  const pageBanner = isSectionPage ? resolveUrl(pageCfg.pageBannerUrl) : null;
  const pageAlign = isSectionPage ? pageCfg.pageAlign || "center" : "center"; // center|left
  const pagePad = isSectionPage ? pageCfg.pagePad || "normal" : "normal"; // compact|normal|roomy
  const pageWidth = isSectionPage ? pageCfg.pageWidth || "normal" : "normal"; // narrow|normal|wide
  const pageDividers = isSectionPage ? Boolean(pageCfg.pageDividers) : false;

  // заход 3: высота баннера, текст поверх баннера, светлый текст, кнопки, CTA
  const bannerHeight = isSectionPage
    ? pageCfg.pageBannerHeight || "mid"
    : "mid"; // low|mid|high
  const titleOnBanner = isSectionPage
    ? Boolean(pageCfg.pageTitleOnBanner)
    : false;
  const pageLightText = isSectionPage && (pageCfg.pageLightText || pageBg.dark); // явный тумблер или тёмный фон
  const pageButtons =
    isSectionPage && Array.isArray(pageCfg.pageButtons)
      ? pageCfg.pageButtons.filter((b) => b && b.label)
      : [];
  const pageCta = isSectionPage ? pageCfg.pageCta || null : null;
  const hasCta = pageCta && pageCta.title;

  const PAGE_WIDTH_PX = { narrow: 760, normal: null, wide: 1320 };
  const vpMax = PAGE_WIDTH_PX[pageWidth]; // null = наследовать --v-content-max

  // карта тип→блок для доп. блоков (берём реальные блоки layout)
  const blockByType = {};
  for (const b of allBlocks) blockByType[b.type] = b;

  const hasIntro = pageIntro && (pageIntro.title || pageIntro.text);

  // базовый путь витрины для умных ссылок
  const vBase = clinic?.slug ? `/clinics/${clinic.slug}` : "";

  // кнопки-якоря (общий рендер для intro и баннер-капшена)
  const renderButtons = () =>
    pageButtons.length > 0 ? (
      <div className="vt-page-btns">
        {pageButtons.map((b, i) => (
          <SmartLink
            key={i}
            raw={b.href}
            base={vBase}
            className={
              "vt-page-btn " +
              (b.style === "ghost"
                ? "vt-page-btn--ghost"
                : "vt-page-btn--primary")
            }
          >
            {b.label}
          </SmartLink>
        ))}
      </div>
    ) : null;

  // рендер одного блока
  const renderBlock = (block) => {
    const Component = getBlockComponent(block.type);
    if (!Component) return null;
    const key = block.id || `${block.type}-${block.order}`;
    return <Component key={key} clinic={clinic} config={block.config || {}} />;
  };

  if (isSectionPage) {
    const top = blocks.filter((b) => b.type === "topbar" || b.type === "nav");
    const footer = blocks.filter((b) => b.type === "footer");
    const main = blocks.filter((b) => !CHROME_TYPES.has(b.type));

    const extraBlocks = extras
      .map((type) => blockByType[type])
      .filter((b) => b && b.type !== sectionType);

    const pageClass =
      "vt-page" +
      (pagePad === "compact" ? " vt-page--compact" : "") +
      (pagePad === "roomy" ? " vt-page--roomy" : "");

    // ширина: задаём CSS-переменную --vp-max только если narrow/wide
    const widthVar = vpMax ? { "--vp-max": `${vpMax}px` } : {};

    // заголовок поверх баннера (если есть баннер, включён тумблер и есть intro)
    const showCapOnBanner = pageBanner && titleOnBanner && hasIntro;

    const Divider = () =>
      pageDividers ? <div className="vt-page-divider" /> : null;

    return (
      <div
        className={"vitrina-root " + pageClass}
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          ...rootStyle,
          minHeight: "100vh",
          ...bgStyle,
          ...(pageBg.hasBg ? pageBg.style : {}),
          ...widthVar,
        }}
      >
        <style>{PAGE_CSS}</style>
        {top.map(renderBlock)}

        {pageBanner && (
          <div
            className={
              "vt-page-banner vt-page-banner--" +
              bannerHeight +
              (showCapOnBanner ? " vt-page-banner--overlay" : "")
            }
          >
            <img src={pageBanner} alt={pageIntro?.title || ""} />
            {showCapOnBanner && (
              <div
                className={
                  "vt-page-banner-cap" +
                  (pageAlign === "left" ? " vt-cap--left" : "")
                }
              >
                {pageIntro.title && <h1>{pageIntro.title}</h1>}
                {pageIntro.text && <p>{pageIntro.text}</p>}
                {renderButtons()}
              </div>
            )}
          </div>
        )}

        {hasIntro && !showCapOnBanner && (
          <header
            className={
              "vt-page-intro" +
              (pageAlign === "left" ? " vt-page-intro--left" : "") +
              (pageLightText ? " vt-page-intro--light" : "")
            }
          >
            {pageIntro.title && (
              <h1 className="vt-page-intro-title">{pageIntro.title}</h1>
            )}
            {pageIntro.text && (
              <p className="vt-page-intro-text">{pageIntro.text}</p>
            )}
            {renderButtons()}
          </header>
        )}

        {main.map(renderBlock)}

        {extraBlocks.map((b, idx) => (
          <React.Fragment key={b.id || `${b.type}-${idx}`}>
            <Divider />
            {renderBlock(b)}
          </React.Fragment>
        ))}

        {hasCta && (
          <>
            <Divider />
            <section className="vt-page-cta">
              <div className="vt-page-cta-card">
                <h3>{pageCta.title}</h3>
                {pageCta.btnText &&
                  (pageCta.btnHref ? (
                    <SmartLink
                      raw={pageCta.btnHref}
                      base={vBase}
                      className="vt-page-cta-btn"
                    >
                      {pageCta.btnText}
                    </SmartLink>
                  ) : (
                    <a
                      className="vt-page-cta-btn"
                      href={pageCta.btnPhone ? telHref(pageCta.btnPhone) : "#"}
                    >
                      {pageCta.btnText}
                    </a>
                  ))}
              </div>
            </section>
          </>
        )}

        {pageOutro && (
          <>
            <Divider />
            <section className="vt-page-outro">
              <div className="vt-page-outro-card">{pageOutro}</div>
            </section>
          </>
        )}

        {footer.map(renderBlock)}
      </div>
    );
  }

  // Главная — как было
  return (
    <div
      className="vitrina-root"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ ...rootStyle, minHeight: "100vh", ...bgStyle }}
    >
      {blocks.map(renderBlock)}
    </div>
  );
}
