// client/src/pages/clinic/vitrina/PublicationDetailRenderer.jsx
//
// ВИТРИНА — публикация врача ВНУТРИ сайта клиники:
//   /<slug>/publications/:id
//
// Блок «Публикации» раньше открывал статью в НОВОЙ ВКЛАДКЕ, на адресе
// платформы (/public/doctor-profile/article-detail-for-all/:id или научный
// аналог) и с платформенной шапкой. Здесь та же статья показана в теме
// клиники и по её адресу.
//
// content — HTML из редактора статей. Прогоняем через sanitizeHtml, как и на
// остальных страницах со статьями: источник доверенный, но публичная страница
// не то место, где стоит на это полагаться.
//
// Хлебная крошка ведёт к автору ВНУТРИ витрины (author.doctorId), а не на
// платформу; если врача в клинике уже нет — на саму витрину.

import React, { useEffect } from "react";
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
import { sh } from "../../../lib/sanitizeHtml";

const CHROME_TOP = new Set(["topbar", "nav"]);

const PUB_CSS = `
.vt-pubd { min-height: 100vh; }
.vt-pubd-main { max-width: 820px; margin: 0 auto; padding: 28px 24px 64px; font-family: var(--v-font-body); color: var(--v-text); }
.vt-pubd-crumbs { font-size: 13px; color: var(--v-text-muted); margin-bottom: 18px; }
.vt-pubd-crumbs a { color: var(--v-primary); text-decoration: none; }
.vt-pubd-crumbs a:hover { text-decoration: underline; }
.vt-pubd-kind { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--v-primary); background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 100px; padding: 5px 12px; margin-bottom: 14px; }
.vt-pubd-cover { width: 100%; max-height: 420px; object-fit: cover; border-radius: 14px; background: var(--v-surface-alt); display: block; margin-bottom: 24px; }
.vt-pubd-title { font-family: var(--v-font-heading); font-size: clamp(26px, 4vw, 40px); font-weight: 700; line-height: 1.18; margin: 0 0 12px; }
.vt-pubd-meta { display: flex; gap: 14px; font-size: 13px; color: var(--v-text-muted); margin-bottom: 26px; flex-wrap: wrap; }
.vt-pubd-meta a { color: var(--v-primary); text-decoration: none; }
.vt-pubd-abs { font-size: 17px; line-height: 1.6; color: var(--v-text-muted); border-inline-start: 3px solid var(--v-primary); padding-inline-start: 16px; margin-bottom: 28px; }
.vt-pubd-body { font-size: 16px; line-height: 1.75; }
.vt-pubd-body h2 { font-family: var(--v-font-heading); font-size: 24px; margin: 28px 0 12px; }
.vt-pubd-body h3 { font-family: var(--v-font-heading); font-size: 20px; margin: 22px 0 10px; }
.vt-pubd-body p { margin: 0 0 16px; }
.vt-pubd-body ul, .vt-pubd-body ol { margin: 0 0 16px; padding-inline-start: 24px; }
.vt-pubd-body li { margin-bottom: 6px; }
.vt-pubd-body img { max-width: 100%; height: auto; border-radius: 10px; margin: 16px 0; }
.vt-pubd-body a { color: var(--v-primary); }
.vt-pubd-body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
.vt-pubd-body th, .vt-pubd-body td { border: 1px solid var(--v-border); padding: 8px 10px; text-align: start; }
.vt-pubd-tags { margin-top: 22px; display: flex; gap: 8px; flex-wrap: wrap; }
.vt-pubd-tag { font-size: 12px; color: var(--v-text-muted); background: var(--v-surface-alt); border: 1px solid var(--v-border); border-radius: 999px; padding: 3px 12px; }
.vt-pubd-refs { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--v-border); font-size: 14px; color: var(--v-text-muted); word-break: break-word; white-space: pre-line; }
`;

export default function PublicationDetailRenderer({ clinic, publication }) {
  const { i18n, t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const rootStyle = useVitrinaTheme(clinic?.theme);
  const slug = params.slug || clinic?.slug || "";

  const clinicName = clinic?.name || "";
  const title = publication?.title || "";
  const metaDesc = publication?.metaDescription || publication?.abstract || "";
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

  if (!clinic || !publication) return null;

  const isRTL = RTL_LANGS.includes(i18n?.language);
  const base = clinicBasePath(location.pathname, slug);

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

  const cover = resolveUrl(publication.imageUrl);
  const author = publication.author || {};
  const authorHref = author.doctorId ? `${base}/doctors/${author.doctorId}` : null;
  const tags = Array.isArray(publication.tags) ? publication.tags : [];

  return (
    <div
      className="vitrina-root vt-pubd"
      dir={isRTL ? "rtl" : "ltr"}
      style={rootStyle}
    >
      <style>{PUB_CSS}</style>

      {topChrome.map(renderBlock)}

      <main className="vt-pubd-main">
        <nav className="vt-pubd-crumbs">
          <Link to={authorHref || base}>
            ←{" "}
            {authorHref
              ? author.name ||
                t("publicPage.backToDoctor", { defaultValue: "К врачу" })
              : clinicName}
          </Link>
        </nav>

        <span className="vt-pubd-kind">
          {publication.kind === "scientific"
            ? t("publicPage.kindScientific", { defaultValue: "Научная" })
            : t("publicPage.kindOpinion", { defaultValue: "Мнение" })}
        </span>

        {cover && <img className="vt-pubd-cover" src={cover} alt={title} />}

        <h1 className="vt-pubd-title">{title}</h1>

        <div className="vt-pubd-meta">
          {author.name &&
            (authorHref ? (
              <Link to={authorHref}>{author.name}</Link>
            ) : (
              <span>{author.name}</span>
            ))}
          {publication.createdAt && (
            <span>{formatDate(publication.createdAt, i18n?.language)}</span>
          )}
          {publication.readTime > 0 && (
            <span>
              {t("publicPage.readTime", {
                defaultValue: "{{count}} мин чтения",
                count: publication.readTime,
              })}
            </span>
          )}
        </div>

        {publication.abstract && (
          <div className="vt-pubd-abs">{publication.abstract}</div>
        )}

        <div
          className="vt-pubd-body"
          dangerouslySetInnerHTML={{ __html: sh(publication.content || "") }}
        />

        {tags.length > 0 && (
          <div className="vt-pubd-tags">
            {tags.map((tag, i) => (
              <span className="vt-pubd-tag" key={i}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {publication.references && (
          <div className="vt-pubd-refs">
            {t("publicPage.articleLinks", { defaultValue: "Источники:" })}{" "}
            {publication.references}
          </div>
        )}
      </main>

      {footer.map(renderBlock)}
    </div>
  );
}
