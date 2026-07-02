// client/src/pages/clinic/vitrina/blocks/ReviewsBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок reviews (этап C).
// Сводный рейтинг (крупное среднее + звёзды + количество) и список отзывов.
// Порт .pcp-rating-* / .pcp-review-* на токены. namespace "clinicReviews".
//
// Данные из DTO: clinic.rating {avg,count}, clinic.reviews [{id,authorName,rating,text,createdAt}].
// Нет отзывов / count=0 → блок не рендерится (как в текущей странице).
//
// Контракт: ({ clinic, config }).

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";
import Stars from "../components/Stars.jsx";
import { formatDate } from "../lib/utils.js";

const CSS = `
.vt-rating-summary { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
.vt-rating-big { font-family: var(--v-font-heading); font-size: 46px; font-weight: 700; color: var(--v-text); line-height: 1; }
.vt-rating-side { display: flex; flex-direction: column; gap: 4px; }
.vt-rating-count { font-size: 13px; color: var(--v-text-muted); }
.vt-reviews-list { display: flex; flex-direction: column; gap: 14px; }
.vt-review { border: 1px solid var(--v-border); border-radius: 12px; padding: 16px 18px; background: var(--v-bg); }
.vt-review-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.vt-review-author { font-size: 14px; font-weight: 600; color: var(--v-text); }
.vt-review-date { font-size: 11.5px; color: var(--v-text-muted); }
.vt-review-text { font-size: 14px; color: var(--v-text-muted); line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
`;

export default function ReviewsBlock({ clinic, config = {} }) {
  const { t: tr, i18n } = useTranslation("clinicReviews");

  const rating = clinic?.rating || { avg: 0, count: 0 };
  const reviews = Array.isArray(clinic?.reviews) ? clinic.reviews : [];
  const hasReviews = (rating.count || 0) > 0 && reviews.length > 0;
  if (!hasReviews) return null;

  return (
    <Section bg={blockBgStyle(config)} id="reviews" title={tr("sectionTitle")}>
      <style>{CSS}</style>

      <div className="vt-rating-summary">
        <div className="vt-rating-big">{rating.avg}</div>
        <div className="vt-rating-side">
          <Stars value={rating.avg} size={20} />
          <span className="vt-rating-count">
            {tr("count", { count: rating.count })}
          </span>
        </div>
      </div>

      <div className="vt-reviews-list">
        {reviews.map((r) => (
          <div className="vt-review" key={r.id}>
            <div className="vt-review-head">
              <span className="vt-review-author">{r.authorName}</span>
              <Stars value={r.rating} size={14} />
            </div>
            {r.text && <div className="vt-review-text">{r.text}</div>}
            {r.createdAt && (
              <div className="vt-review-date">
                {formatDate(r.createdAt, i18n.language)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
