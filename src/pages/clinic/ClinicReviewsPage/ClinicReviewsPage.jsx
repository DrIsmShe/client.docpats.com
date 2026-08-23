// client/src/pages/clinic/ClinicReviewsPage/ClinicReviewsPage.jsx
//
// Mounted in BOTH clinic zones:
//   /clinic/reviews            -> owner zone    (owner/admin, review RW)
//   /clinic/employee/reviews   -> employee zone (manager, review RW)
//
// Review moderation. Backend endpoints (already live):
//   GET   /api/v1/clinic/clinics/:clinicId/reviews?status=&limit=&skip=
//   PATCH /api/v1/clinic/clinics/:clinicId/reviews/:reviewId  { action, note }
// action is strictly "approve" | "reject" (server validates).
//
// Variant A: card shows the active version (pending if present, else published).

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
import {
  listClinicReviews,
  moderateClinicReview,
  getClinicPublicFeedback,
} from "../../../api/clinic";
import "./clinicReviewsPage.css";

// Три раздела страницы. Первый — отзывы О КЛИНИКЕ, её собственная сущность с
// модерацией. Два других — то, что показано на витрине под врачом и под
// статьёй: отзыв врачу и комментарий. Они принадлежат врачу и общему
// обсуждению, поэтому здесь только чтение — прятать их клиника не вправе.
const SECTIONS = [
  { key: "clinic", labelKey: "reviews.sections.clinic" },
  { key: "doctors", labelKey: "reviews.sections.doctors" },
  { key: "comments", labelKey: "reviews.sections.comments" },
];

const STATUS_TABS = [
  { key: "pending", labelKey: "reviews.tabs.pending" },
  { key: "approved", labelKey: "reviews.tabs.approved" },
  { key: "rejected", labelKey: "reviews.tabs.rejected" },
  { key: "all", labelKey: "reviews.tabs.all" },
];

const STATUS_LABEL = {
  pending: "\u041D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438",
  approved: "\u041E\u0434\u043E\u0431\u0440\u0435\u043D",
  rejected: "\u041E\u0442\u043A\u043B\u043E\u043D\u0451\u043D",
};

function extractReviews(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.reviews || data.items || data.data || [];
}

function activeVersion(review) {
  return review.pending || review.published || null;
}

function Stars({ rating }) {
  const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <span className="rev-stars" aria-label={r + "/5"}>
      {"\u2605".repeat(r)}
      <span className="rev-stars-empty">{"\u2606".repeat(5 - r)}</span>
    </span>
  );
}

export default function ClinicReviewsPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const { dashboardPath, loginPath } = useClinicZone();

  const [section, setSection] = useState("clinic");
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [statusTab, setStatusTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const clinicId =
    layoutContext?.clinic?._id ||
    layoutContext?.clinic?.id ||
    layoutContext?.clinicId ||
    null;

  const myRole = layoutContext?.role || "member";
  const perms = layoutContext?.permissions || {};
  const isOwner = myRole === "owner";
  const canModerate = isOwner || !!perms?.review?.write;

  const load = useCallback(
    async (tab) => {
      if (!clinicId) {
        setError("No clinic context");
        setLoading(false);
        return;
      }
      try {
        setError(null);
        setLoading(true);
        const opts = tab && tab !== "all" ? { status: tab } : {};
        const res = await listClinicReviews(clinicId, opts);
        setReviews(extractReviews(res));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load reviews:", err);
        if (err.response?.status === 401) {
          navigate(loginPath, { replace: true });
          return;
        }
        setError(err.response?.data?.error || err.message || "Failed to load reviews");
        setLoading(false);
      }
    },
    [clinicId, navigate, loginPath],
  );

  useEffect(() => {
    load(statusTab);
  }, [statusTab, load]);

  async function handleModerate(review, action) {
    const id = review._id || review.id;
    if (!id) return;

    let note = null;
    if (action === "reject") {
      note = window.prompt(
        t("reviews.rejectNotePrompt", {
          defaultValue: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u044F (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E):",
        }),
        "",
      );
      if (note === null) return;
    }

    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await moderateClinicReview(clinicId, id, action, note || undefined);
      await load(statusTab);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("reviews.moderateFailed", {
            defaultValue: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  }

  const loadFeedback = useCallback(async () => {
    if (!clinicId) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      setFeedback(await getClinicPublicFeedback(clinicId));
    } catch (err) {
      setFeedbackError(
        err?.response?.data?.error || err.message || "Не удалось загрузить",
      );
    } finally {
      setFeedbackLoading(false);
    }
  }, [clinicId]);

  // Запрос уходит при первом открытии раздела, а не при загрузке страницы:
  // большинство заходит сюда ради модерации отзывов о клинике.
  useEffect(() => {
    if (section === "clinic" || feedback || feedbackLoading) return;
    loadFeedback();
  }, [section, feedback, feedbackLoading, loadFeedback]);

  const renderFeedbackList = (items, renderCard) => {
    if (feedbackError) {
      return (
        <div className="rev-error">
          <p>{feedbackError}</p>
          <button onClick={loadFeedback} type="button">
            {t("common.retry", { defaultValue: "Повторить" })}
          </button>
        </div>
      );
    }
    if (feedbackLoading || !feedback) {
      return (
        <div className="rev-loading">
          <div className="rev-spinner" />
        </div>
      );
    }
    if (!items.length) {
      return (
        <div className="rev-empty">
          {t("reviews.emptyFeedback", { defaultValue: "Пока пусто" })}
        </div>
      );
    }
    return <div className="rev-list">{items.map(renderCard)}</div>;
  };

  return (
    <div className="rev-page">
      <div className="rev-page-header">
        <Link to={dashboardPath} className="rev-page-back">
          {t("reviews.back", { defaultValue: "\u2190 \u0414\u0430\u0448\u0431\u043E\u0440\u0434" })}
        </Link>
        <h1>{t("reviews.title", { defaultValue: "\u041E\u0442\u0437\u044B\u0432\u044B" })}</h1>
        <p className="rev-page-subtitle">
          {t("reviews.subtitle", { defaultValue: "\u041C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u044F \u043E\u0442\u0437\u044B\u0432\u043E\u0432 \u043F\u0430\u0446\u0438\u0435\u043D\u0442\u043E\u0432" })}
        </p>
      </div>

      <div className="rev-sections">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            type="button"
            className={"rev-section " + (section === sec.key ? "is-active" : "")}
            onClick={() => setSection(sec.key)}
          >
            {t(sec.labelKey)}
          </button>
        ))}
      </div>

      {section === "clinic" && (
      <div className="rev-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={"rev-tab " + (statusTab === tab.key ? "is-active" : "")}
            onClick={() => setStatusTab(tab.key)}
            disabled={loading}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      )}

      {section === "doctors" ? (
        <>
          <p className="rev-note">
            {t("reviews.doctorsNote", {
              defaultValue:
                "Отзывы пациентов врачам. Показаны на страницах врачей вашего сайта. Отзыв оставлен врачу и живёт на его профиле — изменить его из кабинета клиники нельзя.",
            })}
          </p>
          {renderFeedbackList(feedback?.doctorReviews || [], (r) => (
            <div className="rev-card" key={r.id}>
              <div className="rev-card-top">
                <Stars rating={r.rating} />
                <span className="rev-target">{r.doctorName}</span>
              </div>
              {r.text ? (
                <p className="rev-text">{r.text}</p>
              ) : (
                <p className="rev-text rev-text-empty">
                  {t("reviews.noText", { defaultValue: "Без текста" })}
                </p>
              )}
              {r.reply && (
                <div className="rev-reply">
                  {t("reviews.doctorReply", { defaultValue: "Ответ врача: " })}
                  {r.reply}
                </div>
              )}
              <div className="rev-card-meta">
                {r.authorName ? `${r.authorName} · ` : ""}
                {formatDate(r.createdAt)}
              </div>
            </div>
          ))}
        </>
      ) : section === "comments" ? (
        <>
          <p className="rev-note">
            {t("reviews.commentsNote", {
              defaultValue:
                "Комментарии к вашим врачам и их публикациям. Часть общего обсуждения на платформе — из кабинета клиники они не редактируются.",
            })}
          </p>
          {renderFeedbackList(feedback?.comments || [], (c) => (
            <div className="rev-card" key={c.id}>
              <div className="rev-card-top">
                <span className="rev-target">
                  {c.targetType === "Doctor"
                    ? t("reviews.onDoctor", { defaultValue: "Врач: " })
                    : t("reviews.onArticle", { defaultValue: "Статья: " })}
                  {c.targetTitle}
                </span>
                {c.isReply && (
                  <span className="rev-badge">
                    {t("reviews.isReply", { defaultValue: "ответ" })}
                  </span>
                )}
              </div>
              <p className="rev-text">{c.content}</p>
              <div className="rev-card-meta">
                {c.authorName ? `${c.authorName} · ` : ""}
                {formatDate(c.createdAt)}
              </div>
            </div>
          ))}
        </>
      ) : error ? (
        <div className="rev-error">
          <p>{error}</p>
          <button onClick={() => load(statusTab)} type="button">
            {t("common.retry", { defaultValue: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })}
          </button>
        </div>
      ) : loading ? (
        <div className="rev-loading">
          <div className="rev-spinner" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rev-empty">
          {t("reviews.empty", { defaultValue: "\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u043D\u0435\u0442" })}
        </div>
      ) : (
        <div className="rev-list">
          {reviews.map((review) => {
            const id = review._id || review.id;
            const v = activeVersion(review);
            const busy = !!actionLoading[id];
            const isPending = review.status === "pending";

            return (
              <div key={id} className={"rev-card status-" + review.status}>
                <div className="rev-card-top">
                  <Stars rating={v?.rating} />
                  <span className={"rev-badge badge-" + review.status}>
                    {STATUS_LABEL[review.status] || review.status}
                  </span>
                </div>

                {v?.text ? (
                  <p className="rev-text">{v.text}</p>
                ) : (
                  <p className="rev-text rev-text-empty">
                    {t("reviews.noText", { defaultValue: "\u0411\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430" })}
                  </p>
                )}

                <div className="rev-card-meta">
                  {formatDate(v?.at || review.createdAt)}
                </div>

                {review.moderationNote ? (
                  <div className="rev-mod-note">
                    {t("reviews.noteLabel", { defaultValue: "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435: " })}
                    {review.moderationNote}
                  </div>
                ) : null}

                {canModerate && isPending && (
                  <div className="rev-actions">
                    <button
                      type="button"
                      className="rev-btn rev-btn-approve"
                      onClick={() => handleModerate(review, "approve")}
                      disabled={busy}
                    >
                      {t("reviews.approve", { defaultValue: "\u041E\u0434\u043E\u0431\u0440\u0438\u0442\u044C" })}
                    </button>
                    <button
                      type="button"
                      className="rev-btn rev-btn-reject"
                      onClick={() => handleModerate(review, "reject")}
                      disabled={busy}
                    >
                      {t("reviews.reject", { defaultValue: "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C" })}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}