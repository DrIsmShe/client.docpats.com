// client/src/pages/clinic/vitrina/blocks/PublicationsBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок publications (этап D).
// Карточки статей врачей клиники. Порт .pcp-pubs / .pcp-pub на токены.
// namespace "clinicReviews" (tr("publicationsTitle"), tr("readTime",{count})).
//
// Данные из DTO: clinic.publications [{id,title,abstract,imageUrl,authorName,readTime,url}].
// Пустой список → блок не рендерится. Ссылка — обычный <a href={p.url}>
// (внутренний /public/doctor-profile/article-detail-for-all/:id).
//
// Контракт: ({ clinic, config }).

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";
import { resolveUrl } from "../lib/utils.js";

const CSS = `
.vt-pubs { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.vt-pub { display: flex; flex-direction: column; background: var(--v-surface); border: 1px solid var(--v-border); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow .2s, border-color .2s, transform .2s; }
.vt-pub:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); border-color: var(--v-primary); transform: translateY(-3px); }
.vt-pub-img { width: 100%; height: 148px; object-fit: cover; background: var(--v-surface-alt); display: block; }
.vt-pub-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.vt-pub-title { font-family: var(--v-font-heading); font-size: 15px; font-weight: 600; color: var(--v-text); line-height: 1.35; }
.vt-pub-kind { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 2px 9px; border-radius: 999px; margin-bottom: 7px; }
.vt-pub-kind-scientific { background: rgba(59,130,246,.12); color: #2563eb; }
.vt-pub-kind-opinion { background: rgba(34,197,94,.12); color: #16a34a; }
.vt-pub-abstract { font-size: 13px; color: var(--v-text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.vt-pub-meta { display: flex; gap: 12px; font-size: 12px; color: var(--v-text-muted); margin-top: 2px; flex-wrap: wrap; }
`;

export default function PublicationsBlock({ clinic, config = {} }) {
  const { t: tr } = useTranslation("clinicReviews");

  const pubs = Array.isArray(clinic?.publications) ? clinic.publications : [];
  if (pubs.length === 0) return null;

  return (
    <Section
      bg={blockBgStyle(config)}
      id="publications"
      title={tr("publicationsTitle", { defaultValue: "Статьи наших врачей" })}
    >
      <style>{CSS}</style>
      <div className="vt-pubs">
        {pubs.map((p) => {
          const img = resolveUrl(p.imageUrl);
          // url приходит из DTO уже корректный (мнение/научная). Фолбэк —
          // защита от старого DTO с битым /articles/:id (это адрес синтез-
          // статьи, а не публикации врача). Старая форма /public/articles/:id
          // теперь редиректит на /articles/:id — ловим обе.
          let href = p.url || "";
          if (!href || /^\/(public\/)?articles\//.test(href)) {
            href = p.id
              ? `/public/doctor-profile/article-detail-for-all/${p.id}`
              : href;
          }
          const kindLabel =
            p.kind === "scientific"
              ? tr("kindScientific", { defaultValue: "Научная" })
              : tr("kindOpinion", { defaultValue: "Мнение" });
          return (
            <a
              className="vt-pub"
              href={href}
              key={p.id}
              target="_blank"
              rel="noopener noreferrer"
            >
              {img && <img className="vt-pub-img" src={img} alt={p.title} />}
              <div className="vt-pub-body">
                <div
                  className={`vt-pub-kind vt-pub-kind-${p.kind || "opinion"}`}
                >
                  {kindLabel}
                </div>
                <div className="vt-pub-title">{p.title}</div>
                {p.abstract && (
                  <div className="vt-pub-abstract">{p.abstract}</div>
                )}
                <div className="vt-pub-meta">
                  {p.authorName && <span>{p.authorName}</span>}
                  {p.readTime > 0 && (
                    <span>{tr("readTime", { count: p.readTime })}</span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </Section>
  );
}
