// ClinicConsentCard.jsx
// Sprint 3.1 — карточка одной клиники в списке "Мои клиники".
// Clinic-as-Brand этап C — секция «Мой отзыв» (рейтинг + текст), i18n ns "clinicReviews".

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { submitMyClinicReview, getMyClinicReview } from "../../../api/patient";

/* SVG icons inline (same style as MyDoctors) */
const IconShield = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconSettings = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconMapPin = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CardStyles = () => (
  <style>{`
    .cc-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .cc-card:hover {
      border-color: #c7d2fe;
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -14px rgba(99, 102, 241, 0.2);
    }
    .cc-head {
      display: flex;
      gap: 14px;
      padding: 22px 22px 18px;
      border-bottom: 1px solid #f1f5f9;
    }
    .cc-logo {
      width: 56px; height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ede9fe 0%, #cffafe 100%);
      display: flex; align-items: center; justify-content: center;
      color: #6366f1;
      flex-shrink: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .cc-logo img {
      width: 100%; height: 100%;
      object-fit: cover;
      border-radius: 14px;
    }
    .cc-head-text { flex: 1; min-width: 0; }
    .cc-name {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cc-address {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      color: #64748b;
      margin: 0;
    }
    .cc-body {
      padding: 18px 22px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cc-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cc-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .cc-status-pill.granted {
      background: #ecfdf5;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .cc-status-pill.partial {
      background: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde68a;
    }
    .cc-status-pill.none {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .cc-status-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
    }
    .cc-status-pill.granted .cc-status-dot { background: #16a34a; }
    .cc-status-pill.partial .cc-status-dot { background: #ca8a04; }
    .cc-status-pill.none .cc-status-dot { background: #94a3b8; }

    .cc-meta {
      font-size: 12px;
      color: #94a3b8;
    }
    .cc-meta strong {
      color: #475569;
      font-weight: 600;
    }

    .cc-actions {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 16px;
      border-radius: 11px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      font-family: inherit;
      text-decoration: none;
    }
    .cc-btn:disabled {
      opacity: 0.55;
      cursor: wait;
    }
    .cc-btn.primary {
      background: linear-gradient(135deg, #6366f1 0%, #0891b2 100%);
      color: white;
      box-shadow: 0 4px 12px -4px rgba(99, 102, 241, 0.45);
    }
    .cc-btn.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.55);
    }
    .cc-btn.ghost {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .cc-btn.ghost:hover:not(:disabled) {
      border-color: #cbd5e1;
      background: #f8fafc;
    }
    .cc-btn.danger {
      background: white;
      color: #be123c;
      border-color: #fecdd3;
    }
    .cc-btn.danger:hover:not(:disabled) {
      background: #fff1f2;
      border-color: #fda4af;
    }

    /* ── Review section (этап C) ── */
    .cc-review {
      border-top: 1px dashed #e2e8f0;
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cc-review-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cc-review-badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .cc-review-badge.pending {
      background: #fef9c3; color: #854d0e; border: 1px solid #fde68a;
    }
    .cc-review-badge.approved {
      background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0;
    }
    .cc-review-badge.rejected {
      background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;
    }
    .cc-stars {
      display: inline-flex;
      gap: 3px;
    }
    .cc-star {
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      color: #cbd5e1;
      background: none;
      border: none;
      padding: 0;
      transition: color 0.12s ease, transform 0.12s ease;
    }
    .cc-star:hover:not(:disabled) { transform: scale(1.12); }
    .cc-star.on { color: #f59e0b; }
    .cc-star:disabled { cursor: default; }
    .cc-review-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.5;
      color: #0f172a;
      resize: vertical;
      min-height: 64px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .cc-review-textarea:focus { border-color: #6366f1; }
    .cc-review-textarea:disabled { opacity: 0.6; }
    .cc-review-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .cc-review-hint {
      font-size: 11px;
      color: #94a3b8;
    }
    .cc-review-saved {
      font-size: 12px;
      color: #16a34a;
      font-weight: 600;
    }
  `}</style>
);

function getConsentStatus(consent) {
  if (!consent) return "none";
  const scopes = consent.scopes || {};
  const keys = [
    "encounters",
    "allergies",
    "chronicDiseases",
    "operations",
    "familyHistory",
    "immunization",
    "imaging",
  ];
  const trueCount = keys.filter((k) => Boolean(scopes[k])).length;
  if (trueCount === keys.length) return "granted";
  if (trueCount > 0) return "partial";
  return "none";
}

function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(lang || "ru", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ClinicConsentCard({
  item,
  busy,
  onGrantFull,
  onGranular,
  onRevoke,
  t,
}) {
  // Отдельный namespace для отзывов (t — проп из MyClinics, ns "PatuentTranslate")
  const { t: tr } = useTranslation("clinicReviews");

  const { clinic, card, consent } = item || {};

  // ─── Review state (этап C) ───
  const clinicId = clinic?._id || null;
  const canReview = clinic?.isPublished === true;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [reviewStatus, setReviewStatus] = useState(null); // null|pending|approved|rejected
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!clinicId || !canReview) {
      setReviewLoaded(true);
      return;
    }
    (async () => {
      try {
        const { review } = await getMyClinicReview(clinicId);
        if (cancelled) return;
        if (review) {
          setRating(review.rating || 0);
          setText(review.text || "");
          setReviewStatus(review.status || null);
        }
      } catch {
        // нет отзыва / ошибка — просто пустая форма
      } finally {
        if (!cancelled) setReviewLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicId, canReview]);

  const handleSubmitReview = async () => {
    if (!clinicId || reviewBusy || rating < 1) return;
    setReviewBusy(true);
    try {
      const { review } = await submitMyClinicReview({
        clinicId,
        rating,
        text,
      });
      setReviewStatus(review?.status || "pending");
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2500);
    } catch (err) {
      console.error("submit review failed:", err);
    } finally {
      setReviewBusy(false);
    }
  };

  if (!clinic) return null;

  const status = getConsentStatus(consent);
  const initials = (clinic.name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const activeStars = hoverRating || rating;

  return (
    <article className="cc-card">
      <CardStyles />

      {/* Header */}
      <div className="cc-head">
        <div className="cc-logo">
          {clinic.logo ? (
            <img src={clinic.logo} alt={clinic.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="cc-head-text">
          <h3 className="cc-name">
            {clinic.name || t("myClinics.unnamedClinic")}
          </h3>
          {clinic.city && (
            <p className="cc-address">
              <IconMapPin />
              {clinic.city}
              {clinic.country ? `, ${clinic.country}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="cc-body">
        {/* Status */}
        <div className="cc-status-row">
          <span className={`cc-status-pill ${status}`}>
            <span className="cc-status-dot" />
            {status === "granted" && t("myClinics.status.granted")}
            {status === "partial" && t("myClinics.status.partial")}
            {status === "none" && t("myClinics.status.none")}
          </span>
        </div>

        {/* Meta */}
        <div className="cc-meta">
          {consent ? (
            <>
              {t("myClinics.card.grantedAt")}{" "}
              <strong>{formatDate(consent.signedAt)}</strong>
            </>
          ) : (
            <>
              {t("myClinics.card.cardCreatedAt")}{" "}
              <strong>{formatDate(card?.createdAt)}</strong>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="cc-actions">
          {status === "none" && (
            <>
              <button
                className="cc-btn primary"
                onClick={onGrantFull}
                disabled={busy}
              >
                <IconShield />
                {t("myClinics.actions.grantFull")}
              </button>
              <button
                className="cc-btn ghost"
                onClick={onGranular}
                disabled={busy}
              >
                <IconSettings />
                {t("myClinics.actions.granular")}
              </button>
            </>
          )}

          {(status === "granted" || status === "partial") && (
            <>
              <button
                className="cc-btn ghost"
                onClick={onGranular}
                disabled={busy}
              >
                <IconSettings />
                {t("myClinics.actions.changeScopes")}
              </button>
              <button
                className="cc-btn danger"
                onClick={onRevoke}
                disabled={busy}
              >
                <IconX />
                {t("myClinics.actions.revoke")}
              </button>
            </>
          )}
        </div>

        {/* ── Review (этап C) — только для опубликованных клиник ── */}
        {canReview && reviewLoaded && (
          <div className="cc-review">
            <div className="cc-review-title">
              <span>{tr("myTitle")}</span>
              {reviewStatus && (
                <span className={`cc-review-badge ${reviewStatus}`}>
                  {reviewStatus === "pending" && tr("statusPending")}
                  {reviewStatus === "approved" && tr("statusApproved")}
                  {reviewStatus === "rejected" && tr("statusRejected")}
                </span>
              )}
            </div>

            {/* Stars */}
            <div
              className="cc-stars"
              onMouseLeave={() => setHoverRating(0)}
              role="radiogroup"
              aria-label={tr("myTitle")}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`cc-star${n <= activeStars ? " on" : ""}`}
                  disabled={reviewBusy}
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n}`}
                  aria-checked={rating === n}
                  role="radio"
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="cc-review-textarea"
              value={text}
              maxLength={2000}
              disabled={reviewBusy}
              placeholder={tr("placeholder")}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="cc-review-foot">
              <span className="cc-review-hint">
                {reviewSaved ? (
                  <span className="cc-review-saved">{tr("saved")}</span>
                ) : (
                  tr("hint")
                )}
              </span>
              <button
                className="cc-btn primary"
                style={{ padding: "9px 18px" }}
                disabled={reviewBusy || rating < 1}
                onClick={handleSubmitReview}
              >
                {reviewBusy
                  ? tr("sending")
                  : reviewStatus
                    ? tr("update")
                    : tr("submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
