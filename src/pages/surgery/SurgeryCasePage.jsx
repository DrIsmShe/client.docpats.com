import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchCaseById,
  updateCase,
  uploadPhoto,
  removePhoto,
  setOutcome,
  togglePublish,
  addFollowUp,
  clearActiveCase,
} from "./surgerySlice";
import styles from "./Surgery.module.css";
import SimulatorPanel from "./SimulatorPanel";
import SurgeryPlanForm from "./SurgeryPlanForm";
import { API_BASE } from "../../config";

/* ─── Ключи для лукапа (НЕ переводы, это keys для i18n и БД) ─────────── */
const PROCEDURE_KEYS = [
  "rhinoplasty",
  "breast_augmentation",
  "breast_reduction",
  "blepharoplasty",
  "liposuction",
  "abdominoplasty",
  "facelift",
  "otoplasty",
  "chin_implant",
  "lip_augmentation",
  "other",
];

const PHOTO_LABEL_KEYS = [
  "before",
  "after",
  "intra_op",
  "1week",
  "1month",
  "3months",
  "6months",
  "simulation",
];

const STATUS_KEYS = ["planned", "completed", "follow_up", "closed"];

const TAB_KEYS = ["info", "plan", "photos", "simulator", "followup"];

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;

/* ─── Мини-иконки (inline SVG, без зависимостей) ──────────────────────── */
const Icon = {
  info: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  plan: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  photos: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  simulator: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
      <path d="M8 14h8" />
      <path d="M9 22v-4" />
      <path d="M15 22v-4" />
    </svg>
  ),
  followup: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  calendar: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  globe: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  lock: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

const TAB_ICONS = {
  info: Icon.info,
  plan: Icon.plan,
  photos: Icon.photos,
  simulator: Icon.simulator,
  followup: Icon.followup,
};

/* ─── Утилита: цвет для оценки (red → yellow → green) ─────────────────── */
const scoreColor = (n) => {
  if (n <= 3) return "#ef4444";
  if (n <= 6) return "#f59e0b";
  if (n <= 8) return "#84cc16";
  return "#22c55e";
};

/* ─── Subcomponent: Row ─────────────────────────────────────────────── */
function Row({ label, val }) {
  if (!val) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: 16,
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#0f172a",
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        {val}
      </span>
    </div>
  );
}

/* ─── Subcomponent: StatCell (для stats-strip под шапкой) ─────────────── */
function StatCell({ icon, label, value, accent }) {
  return (
    <div
      style={{
        minWidth: 0, // позволяет сжиматься внутри grid/flex
        padding: "12px 14px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          color: "#64748b",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ flexShrink: 0, display: "inline-flex" }}>{icon}</span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: accent || "#0f172a",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ─── Главный компонент ─────────────────────────────────────────────── */
export default function SurgeryCasePage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("Surgery");
  const {
    activeCase: cas,
    caseLoading,
    uploadingPhoto,
  } = useSelector((s) => s.surgery);

  const fileRef = useRef();
  const [tab, setTab] = useState("info");
  const [photoLabel, setPhotoLabel] = useState("before");
  const [scoreInput, setScoreInput] = useState("");
  const [fuForm, setFuForm] = useState({
    date: "",
    notes: "",
    complications: "",
  });
  const [pubError, setPubError] = useState("");
  const [editStatus, setEditStatus] = useState(false);

  useEffect(() => {
    dispatch(fetchCaseById(id));
    return () => dispatch(clearActiveCase());
  }, [dispatch, id]);

  useEffect(() => {
    if (cas?.outcomeScore) setScoreInput(String(cas.outcomeScore));
  }, [cas?.outcomeScore]);

  /* ─── Derived ─────────────────────────────────────────────────────── */
  const dateLocale = useMemo(() => {
    const map = {
      ru: "ru-RU",
      en: "en-US",
      tr: "tr-TR",
      az: "az-AZ",
      ar: "ar",
    };
    return map[i18n.language] || "en-US";
  }, [i18n.language]);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const formatShortDate = (d) =>
    d ? new Date(d).toLocaleDateString(dateLocale) : "—";

  /* ─── Loading / Not found ─────────────────────────────────────────── */
  if (caseLoading)
    return (
      <div className={styles.page}>
        <div className={styles.emptyBox}>
          <p className={styles.empty}>{t("page.loading")}</p>
        </div>
      </div>
    );

  if (!cas)
    return (
      <div className={styles.page}>
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>{t("page.notFound")}</p>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/dp/surgery")}
          >
            {t("page.backToList")}
          </button>
        </div>
      </div>
    );

  const photos = cas.photos || [];
  const followUps = cas.followUps || [];
  const grouped = photos.reduce((acc, p) => {
    (acc[p.label] = acc[p.label] || []).push(p);
    return acc;
  }, {});

  const currentStatusLabel = t(`statuses.${cas.status}`);
  const procedureLabel = t(`procedures.${cas.procedure}`, cas.procedure);

  /* ─── Handlers ────────────────────────────────────────────────────── */
  const handleStatusChange = async (e) => {
    await dispatch(updateCase({ id, data: { status: e.target.value } }));
    setEditStatus(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await dispatch(uploadPhoto({ caseId: id, file, label: photoLabel }));
    fileRef.current.value = "";
  };

  const handleRemovePhoto = (photoId) => {
    if (!window.confirm(t("photos.confirmDelete"))) return;
    dispatch(removePhoto({ caseId: id, photoId }));
  };

  const handleSetScore = async () => {
    const s = Number(scoreInput);
    if (s < 1 || s > 10) return;
    await dispatch(setOutcome({ caseId: id, score: s }));
  };

  const handlePublish = async (publish) => {
    setPubError("");
    const result = await dispatch(togglePublish({ caseId: id, publish }));
    if (result.meta.requestStatus === "rejected") {
      setPubError(result.payload || t("errors.publishError"));
    }
  };

  const handleAddFollowUp = async () => {
    if (!fuForm.date) return;
    await dispatch(addFollowUp({ caseId: id, ...fuForm }));
    setFuForm({ date: "", notes: "", complications: "" });
  };

  const lastFollowUp = followUps.length
    ? [...followUps].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  /* ─── Render ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* ─── Responsive overrides (локальны для страницы) ───────────── */}
      <style>{`
        .surgery-header {
          flex-wrap: wrap;
          gap: 14px;
          row-gap: 14px;
        }
        .surgery-tabs {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        .surgery-tabs::-webkit-scrollbar { height: 4px; }
        .surgery-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .surgery-tabs > button { flex-shrink: 0; }
        .surgery-upload-row { flex-wrap: wrap; gap: 10px; }

        @media (max-width: 640px) {
          .surgery-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          .surgery-header-actions > button {
            flex: 1;
            min-width: 120px;
          }
          .surgery-stats-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          .surgery-fu-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .surgery-title {
            font-size: 22px !important;
            line-height: 1.2 !important;
          }
        }
        @media (max-width: 360px) {
          .surgery-stats-strip {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ══════ HERO HEADER ═══════════════════════════════════════════ */}
      <div className={`${styles.header} surgery-header`}>
        <div>
          <button
            className={styles.btnBack}
            onClick={() => navigate("/dp/surgery")}
          >
            {t("page.allCases")}
          </button>
          <div className={styles.breadcrumb}>{t("page.breadcrumb")}</div>
          <h1 className={`${styles.title} surgery-title`}>{procedureLabel}</h1>
          <p className={styles.subtitle}>
            {formatDate(cas.operationDate)}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginInlineStart: 12,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                background: cas.isPublic ? "#dcfce7" : "#f1f5f9",
                color: cas.isPublic ? "#15803d" : "#475569",
              }}
            >
              {cas.isPublic ? Icon.globe : Icon.lock}
              {cas.isPublic ? t("header.publicCase") : t("header.privateCase")}
            </span>
          </p>
        </div>

        <div className={`${styles.headerActions} surgery-header-actions`}>
          {editStatus ? (
            <select
              className={styles.select}
              defaultValue={cas.status}
              onChange={handleStatusChange}
              onBlur={() => setEditStatus(false)}
              autoFocus
            >
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`statuses.${k}`)}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`${styles.statusBig} ${styles["status_" + cas.status]}`}
              onClick={() => setEditStatus(true)}
              title={t("header.changeStatusTooltip")}
            >
              {currentStatusLabel}
            </span>
          )}

          {cas.isPublic ? (
            <button
              className={styles.btnSecondary}
              onClick={() => handlePublish(false)}
            >
              {t("header.unpublish")}
            </button>
          ) : (
            <button
              className={styles.btnPrimary}
              onClick={() => handlePublish(true)}
            >
              {t("header.publish")}
            </button>
          )}
        </div>
      </div>

      {pubError && <div className={styles.errorBox}>{pubError}</div>}

      {/* ══════ STATS STRIP ═══════════════════════════════════════════ */}
      <div
        className="surgery-stats-strip"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <StatCell
          icon={Icon.calendar}
          label={t("stats.date")}
          value={formatShortDate(cas.operationDate)}
        />
        <StatCell
          icon={Icon.info}
          label={t("stats.status")}
          value={currentStatusLabel}
        />
        <StatCell
          icon={Icon.star}
          label={t("stats.score")}
          value={
            cas.outcomeScore ? `${cas.outcomeScore}/10` : t("stats.noScore")
          }
          accent={cas.outcomeScore ? scoreColor(cas.outcomeScore) : undefined}
        />
        <StatCell
          icon={Icon.photos}
          label={t("stats.photos")}
          value={photos.length}
        />
        <StatCell
          icon={Icon.followup}
          label={t("stats.followups")}
          value={followUps.length}
        />
      </div>

      {/* ══════ TABS ══════════════════════════════════════════════════ */}
      <div className={`${styles.tabs} surgery-tabs`}>
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`}
            onClick={() => setTab(key)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <span style={{ display: "inline-flex", opacity: 0.7 }}>
              {TAB_ICONS[key]}
            </span>
            {t(`tabs.${key}`)}
            {key === "photos" && photos.length > 0 && (
              <span className={styles.tabBadge}>{photos.length}</span>
            )}
            {key === "followup" && followUps.length > 0 && (
              <span className={styles.tabBadge}>{followUps.length}</span>
            )}
            {key === "simulator" && (
              <span
                className={styles.tabBadge}
                style={{ background: "#ede9fe", color: "#5b21b6" }}
              >
                AI
              </span>
            )}
            {key === "plan" && cas.plan?.structured && (
              <span
                className={styles.tabBadge}
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════ TAB: INFO ═════════════════════════════════════════════ */}
      {tab === "info" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* ─── Верхний ряд: 3 компактные карточки (auto-fit, без media queries) ─── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
              alignItems: "start",
            }}
          >
            {/* Параметры */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>{t("info.params")}</h3>
              <div className={styles.metaTable}>
                <Row label={t("info.procedure")} val={procedureLabel} />
                <Row
                  label={t("stats.date")}
                  val={formatDate(cas.operationDate)}
                />
                <Row label={t("stats.status")} val={currentStatusLabel} />
                <Row
                  label={t("info.anesthesia")}
                  val={cas.metrics?.anesthesia}
                />
                <Row label={t("info.technique")} val={cas.metrics?.technique} />
                <Row
                  label={t("info.implantType")}
                  val={cas.metrics?.implantType}
                />
                <Row
                  label={t("info.implantSize")}
                  val={cas.metrics?.implantSize}
                />
                <Row label={t("info.volume")} val={cas.metrics?.volume} />
                <Row
                  label={t("info.duration")}
                  val={
                    cas.metrics?.duration
                      ? `${cas.metrics.duration} ${t("info.minutes")}`
                      : null
                  }
                />
              </div>
            </div>

            {/* Оценка результата */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>{t("info.score")}</h3>
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginBottom: 12,
                }}
              >
                {t("info.scoreHint")}
              </p>
              <div className={styles.scoreRow}>
                <div className={styles.scoreDots}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const active = Number(scoreInput) >= n;
                    return (
                      <button
                        key={n}
                        className={`${styles.scoreDot} ${active ? styles.scoreDotActive : ""}`}
                        onClick={() => setScoreInput(String(n))}
                        style={
                          active
                            ? {
                                background: scoreColor(Number(scoreInput)),
                                borderColor: scoreColor(Number(scoreInput)),
                                color: "#fff",
                              }
                            : undefined
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSetScore}
                  disabled={!scoreInput}
                >
                  {t("info.save")}
                </button>
              </div>
              {cas.outcomeScore && (
                <p
                  className={styles.currentScore}
                  style={{
                    color: scoreColor(cas.outcomeScore),
                    fontWeight: 600,
                  }}
                >
                  {t("info.currentScore", { score: cas.outcomeScore })}
                </p>
              )}
            </div>

            {/* Согласие пациента */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>{t("info.consent")}</h3>
              <p className={styles.empty} style={{ marginBottom: 12 }}>
                {cas.consentGiven
                  ? t("info.consentReceived", {
                      date: formatDate(cas.consentDate),
                    })
                  : t("info.consentNotReceived")}
              </p>
              {!cas.consentGiven && (
                <button
                  className={styles.btnSecondary}
                  onClick={() =>
                    dispatch(updateCase({ id, data: { consentGiven: true } }))
                  }
                >
                  {t("info.markConsent")}
                </button>
              )}
            </div>
          </div>

          {/* ─── Нижний ряд: План операции на всю ширину ─── */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>{t("info.plan")}</h3>
            {cas.plan?.text ? (
              <div className={styles.planText}>{cas.plan.text}</div>
            ) : (
              <div>
                <p className={styles.empty} style={{ marginBottom: 12 }}>
                  {t("info.planNotFilled")}
                </p>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setTab("plan")}
                >
                  {t("info.fillPlan")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ TAB: PLAN ═════════════════════════════════════════════ */}
      {tab === "plan" && <SurgeryPlanForm cas={cas} />}

      {/* ══════ TAB: PHOTOS ═══════════════════════════════════════════ */}
      {tab === "photos" && (
        <div>
          <div className={`${styles.uploadRow} surgery-upload-row`}>
            <select
              className={styles.select}
              value={photoLabel}
              onChange={(e) => setPhotoLabel(e.target.value)}
              aria-label={t("photos.selectLabel")}
            >
              {PHOTO_LABEL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`photoLabels.${k}`)}
                </option>
              ))}
            </select>
            <button
              className={styles.btnPrimary}
              onClick={() => fileRef.current.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? t("photos.uploading") : t("photos.addPhoto")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {photos.length === 0 ? (
            <div className={styles.emptyBox}>
              <p className={styles.emptyTitle}>{t("photos.noPhotos")}</p>
              <p className={styles.emptyText}>{t("photos.noPhotosHint")}</p>
            </div>
          ) : (
            PHOTO_LABEL_KEYS.map((labelKey) => {
              const group = grouped[labelKey];
              if (!group?.length) return null;
              return (
                <div key={labelKey} className={styles.photoGroup}>
                  <h4
                    className={styles.photoGroupTitle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#3b82f6",
                        flexShrink: 0,
                      }}
                    />
                    {t(`photoLabels.${labelKey}`)}
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        fontWeight: 400,
                      }}
                    >
                      · {group.length}
                    </span>
                  </h4>
                  <div className={styles.photoGrid}>
                    {group.map((p) => (
                      <div key={p._id} className={styles.photoItem}>
                        <img
                          src={photoUrl(p.filename)}
                          alt={t(`photoLabels.${labelKey}`)}
                          className={styles.photoFull}
                        />
                        <div className={styles.photoMeta}>
                          <span>{formatShortDate(p.takenAt)}</span>
                          {p.isPublic && (
                            <span className={styles.publicBadge}>
                              {t("photos.public")}
                            </span>
                          )}
                          <button
                            className={styles.btnDeleteSmall}
                            onClick={() => handleRemovePhoto(p._id)}
                            aria-label={t("photos.confirmDelete")}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════ TAB: SIMULATOR ════════════════════════════════════════ */}
      {tab === "simulator" && <SimulatorPanel cas={cas} />}

      {/* ══════ TAB: FOLLOW-UP ════════════════════════════════════════ */}
      {tab === "followup" && (
        <div>
          {/* Mini-summary */}
          {followUps.length > 0 && (
            <div
              className="surgery-fu-summary"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <StatCell
                icon={Icon.followup}
                label={t("followup.totalVisits")}
                value={followUps.length}
              />
              <StatCell
                icon={Icon.calendar}
                label={t("followup.lastVisit")}
                value={lastFollowUp ? formatShortDate(lastFollowUp.date) : "—"}
              />
            </div>
          )}

          {/* Form */}
          <div className={styles.fuForm}>
            <h3 className={styles.cardTitle}>{t("followup.addRecord")}</h3>
            <input
              className={styles.input}
              type="date"
              aria-label={t("followup.datePlaceholder")}
              value={fuForm.date}
              onChange={(e) =>
                setFuForm((f) => ({ ...f, date: e.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder={t("followup.notesPlaceholder")}
              value={fuForm.notes}
              onChange={(e) =>
                setFuForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
            />
            <input
              className={styles.input}
              placeholder={t("followup.complicationsPlaceholder")}
              value={fuForm.complications}
              onChange={(e) =>
                setFuForm((f) => ({ ...f, complications: e.target.value }))
              }
            />
            <button
              className={styles.btnPrimary}
              onClick={handleAddFollowUp}
              disabled={!fuForm.date}
            >
              {t("followup.addEntry")}
            </button>
          </div>

          {/* Timeline */}
          <div className={styles.fuList}>
            {followUps.length === 0 ? (
              <p className={styles.empty}>{t("followup.noRecords")}</p>
            ) : (
              <div
                style={{
                  position: "relative",
                  paddingInlineStart: 24,
                }}
              >
                {/* Вертикальная линия */}
                <div
                  style={{
                    position: "absolute",
                    insetInlineStart: 7,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    background: "#e2e8f0",
                  }}
                />
                {[...followUps]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((fu, idx) => (
                    <div
                      key={fu._id}
                      className={styles.fuItem}
                      style={{ position: "relative", marginBottom: 14 }}
                    >
                      {/* Маркер */}
                      <div
                        style={{
                          position: "absolute",
                          insetInlineStart: -24,
                          top: 14,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: fu.complications ? "#fef2f2" : "#eff6ff",
                          border: `2px solid ${fu.complications ? "#ef4444" : "#3b82f6"}`,
                          boxShadow: "0 0 0 3px #fff",
                        }}
                      />
                      <div className={styles.fuDate}>{formatDate(fu.date)}</div>
                      {fu.notes && <p className={styles.fuNotes}>{fu.notes}</p>}
                      {fu.complications && (
                        <p className={styles.fuComplications}>
                          {t("followup.complications")}: {fu.complications}
                        </p>
                      )}
                      <span className={styles.fuBy}>
                        {t("followup.addedBy")}:{" "}
                        {fu.addedBy === "surgeon"
                          ? t("followup.surgeon")
                          : t("followup.patient")}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
