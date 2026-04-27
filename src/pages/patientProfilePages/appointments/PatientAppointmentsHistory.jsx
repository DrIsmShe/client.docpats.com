// src/pages/patient/PatientAppointmentsHistory.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaClock,
  FaUserMd,
  FaTimesCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

/* ====== Маппинг языков i18n → BCP-47 локали (для дат и Intl) ====== */
const LANG_TO_LOCALE = {
  ru: "ru-RU",
  en: "en-US",
  tr: "tr-TR",
  ar: "ar-SA",
  az: "az-AZ",
};

/* ====================== Иконки ====================== */
const IconHistory = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);
const IconAlert = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconEmpty = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* ====================== Стили ====================== */
const HIStyles = () => (
  <style>{`
    /* ===== Защитный reset ===== */
    .hi-wrap, .hi-wrap *, .hi-wrap *::before, .hi-wrap *::after {
      box-sizing: border-box;
    }

    /* ===== Base ===== */
    .hi-wrap {
      width: 100%;
      max-width: 1100px;
      min-width: 0;
      margin: 0 auto;
      padding: clamp(12px, 2vw, 32px) clamp(8px, 1.5vw, 20px) clamp(40px, 6vw, 80px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      overflow-x: hidden;
    }

    /* ===== Hero ===== */
    .hi-header {
      position: relative;
      width: 100%;
      max-width: 100%;
      padding: clamp(22px, 3.5vw, 34px) clamp(18px, 3vw, 36px);
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      border-radius: clamp(14px, 2vw, 20px);
      color: white;
      overflow: hidden;
      margin-bottom: clamp(14px, 2vw, 22px);
      box-shadow: 0 12px 32px -14px rgba(15, 118, 110, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .hi-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .hi-header-content { position: relative; z-index: 1; min-width: 0; }
    .hi-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.14);
      padding: 5px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .hi-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.35);
    }
    .hi-title {
      font-size: clamp(20px, 3vw, 30px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.2;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .hi-title svg { flex-shrink: 0; }
    .hi-count-pill {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.22);
      flex-shrink: 0;
    }
    .hi-count-icon {
      width: 36px; height: 36px;
      border-radius: 9px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .hi-count-num { font-size: 20px; font-weight: 700; line-height: 1; }
    .hi-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 3px;
    }

    /* ===== Alerts ===== */
    .hi-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      max-width: 100%;
      word-break: break-word;
    }
    .hi-alert svg { flex-shrink: 0; margin-top: 1px; }
    .hi-alert.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    /* ===== Loading ===== */
    .hi-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: clamp(48px, 8vw, 80px) 20px;
      color: #64748b;
      font-size: 14px;
    }
    .hi-spinner {
      width: 24px; height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: hi-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes hi-spin { to { transform: rotate(360deg); } }

    /* ===== Empty ===== */
    .hi-empty {
      text-align: center;
      padding: clamp(40px, 6vw, 60px) 20px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      color: #64748b;
    }
    .hi-empty-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #f0fdfa;
      color: #0891b2;
      margin-bottom: 12px;
    }
    .hi-empty-text { font-size: 14px; color: #64748b; }

    /* ===== List ===== */
    .hi-list {
      display: flex;
      flex-direction: column;
      gap: clamp(10px, 1.4vw, 12px);
      max-width: 100%;
    }

    /* ===== Card ===== */
    .hi-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: clamp(14px, 2vw, 18px) clamp(14px, 2vw, 20px);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      transition: all 0.2s ease;
      overflow: hidden;
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 14px;
      align-items: center;
    }
    .hi-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -12px rgba(8, 145, 178, 0.2);
    }
    .hi-card::before {
      content: "";
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
    }
    .hi-card.confirmed::before { background: linear-gradient(180deg, #15803d, #22c55e); }
    .hi-card.pending::before   { background: linear-gradient(180deg, #b45309, #f59e0b); }
    .hi-card.cancelled::before { background: linear-gradient(180deg, #991b1b, #ef4444); }
    .hi-card.completed::before { background: linear-gradient(180deg, #0369a1, #0891b2); }
    .hi-card.unknown::before   { background: linear-gradient(180deg, #64748b, #94a3b8); }
    .hi-card.cancelled { opacity: 0.72; }
    .hi-card.cancelled:hover { transform: none; }

    .hi-card-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Doctor */
    .hi-doctor {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .hi-doctor-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 3px 8px rgba(8, 145, 178, 0.25);
    }
    .hi-doctor-name {
      font-size: clamp(14px, 1.6vw, 16px);
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Meta row */
    .hi-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 14px;
      font-size: clamp(12px, 1.4vw, 13px);
      color: #475569;
    }
    .hi-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .hi-meta-item svg { color: #0891b2; flex-shrink: 0; }
    .hi-meta-label {
      color: #64748b;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .hi-meta-value { color: #0f172a; font-weight: 500; word-break: break-word; }

    /* Type pill */
    .hi-type-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      text-transform: capitalize;
    }

    /* Right side — status + action */
    .hi-card-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      min-width: 0;
    }

    /* Status badge */
    .hi-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .hi-status-badge::before {
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
    }
    .hi-status-badge.confirmed { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
    .hi-status-badge.confirmed::before { background: #22c55e; }
    .hi-status-badge.pending { color: #854d0e; background: #fefce8; border-color: #fde68a; }
    .hi-status-badge.pending::before { background: #f59e0b; }
    .hi-status-badge.cancelled { color: #991b1b; background: #fef2f2; border-color: #fecaca; }
    .hi-status-badge.cancelled::before { background: #ef4444; }
    .hi-status-badge.completed { color: #075985; background: #f0f9ff; border-color: #bae6fd; }
    .hi-status-badge.completed::before { background: #0891b2; }
    .hi-status-badge.unknown { color: #475569; background: #f1f5f9; border-color: #cbd5e1; }
    .hi-status-badge.unknown::before { background: #64748b; }

    /* Cancel button */
    .hi-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      border: 1px solid transparent;
      min-height: 36px;
      white-space: nowrap;
    }
    .hi-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .hi-btn svg { flex-shrink: 0; }
    .hi-btn-cancel {
      background: white;
      color: #be123c;
      border-color: #fecdd3;
    }
    .hi-btn-cancel:hover:not(:disabled) {
      background: #fff1f2;
      border-color: #f43f5e;
    }
    .hi-btn-spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(190, 18, 60, 0.3);
      border-top-color: #be123c;
      border-radius: 50%;
      animation: hi-spin 0.7s linear infinite;
    }

    /* ===== Breakpoints ===== */
    @media (max-width: 560px) {
      .hi-card {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .hi-card-side {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding-top: 8px;
        border-top: 1px dashed #e2e8f0;
        width: 100%;
      }
      .hi-count-pill { width: 100%; justify-content: center; }
    }
    @media (max-width: 380px) {
      .hi-wrap { padding: 10px 6px 40px; }
      .hi-card { padding: 14px; }
      .hi-header { padding: 18px 14px; }
      .hi-btn { padding: 7px 10px; font-size: 11px; }
    }
  `}</style>
);

export default function PatientAppointmentsHistory() {
  const { t, i18n } = useTranslation();

  /* ── язык / локаль / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.ru;
  const isRTL = currentLang === "ar";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  // В message храним i18n-ключ (или пустую строку), текст берём через t() в рендере —
  // чтобы при смене языка сообщение автоматически перевелось.
  const [message, setMessage] = useState("");
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  // 🔹 Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/appointment-for-patient/my-history`,
          { withCredentials: true },
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          setAppointments(res.data.data);
        } else {
          setMessage("PatientAppointmentsHistory.errors.failedToLoad");
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        setMessage("PatientAppointmentsHistory.errors.loadError");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // 🔹 Cancel appointment
  const handleCancel = async (appointment) => {
    if (!appointment?._id) {
      alert(t("PatientAppointmentsHistory.errors.noId"));
      return;
    }

    if (!window.confirm(t("PatientAppointmentsHistory.actions.confirmCancel")))
      return;

    try {
      setCancelLoadingId(appointment._id);

      const res = await axios.put(
        `${API_BASE}/appointment-for-patient/cancel/${appointment._id}`,
        {},
        { withCredentials: true },
      );

      if (res.data?.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === appointment._id ? { ...a, status: "cancelled" } : a,
          ),
        );
      } else {
        alert(
          res.data?.message ||
            t("PatientAppointmentsHistory.errors.cannotCancel"),
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert(t("PatientAppointmentsHistory.errors.cannotCancel"));
    } finally {
      setCancelLoadingId(null);
    }
  };

  // 🔹 Маппинг статуса → CSS-класс (чтобы работало для любого значения)
  const statusKey = (s) => {
    if (
      s === "confirmed" ||
      s === "pending" ||
      s === "cancelled" ||
      s === "completed"
    ) {
      return s;
    }
    return "unknown";
  };

  // 🔹 Loading indicator
  if (loading) {
    return (
      <div className="hi-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <HIStyles />
        <div className="hi-loading">
          <span className="hi-spinner" />
          <span>{t("PatientAppointmentsHistory.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hi-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <HIStyles />

      {/* ===== Hero ===== */}
      <div className="hi-header">
        <div className="hi-header-content">
          <span className="hi-eyebrow">
            <span className="dot" />
            {t("PatientAppointmentsHistory.eyebrow")}
          </span>
          <h1 className="hi-title">
            <IconHistory />
            {t("PatientAppointmentsHistory.title")}
          </h1>
        </div>
        <div className="hi-count-pill">
          <div className="hi-count-icon">
            <IconHistory />
          </div>
          <div>
            <div className="hi-count-num">{appointments.length}</div>
            <div className="hi-count-label">
              {t("PatientAppointmentsHistory.countLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Error ===== */}
      {message && (
        <div className="hi-alert error" role="alert">
          <IconAlert />
          <span>{t(message)}</span>
        </div>
      )}

      {/* ===== Empty ===== */}
      {appointments.length === 0 && !message && (
        <div className="hi-empty">
          <div className="hi-empty-icon">
            <IconEmpty />
          </div>
          <div className="hi-empty-text">
            {t("PatientAppointmentsHistory.labels.noAppointments")}
          </div>
        </div>
      )}

      {/* ===== List ===== */}
      {appointments.length > 0 && (
        <div className="hi-list">
          {appointments.map((a) => {
            const sKey = statusKey(a.status);
            const isActionable =
              a.status !== "cancelled" && a.status !== "completed";
            const isLoadingThis = cancelLoadingId === a._id;

            return (
              <article key={a._id} className={`hi-card ${sKey}`}>
                <div className="hi-card-main">
                  {/* Doctor */}
                  <div className="hi-doctor">
                    <span className="hi-doctor-icon">
                      <FaUserMd />
                    </span>
                    <h3 className="hi-doctor-name">
                      {a.doctorIdUser?.firstName
                        ? `${a.doctorIdUser.firstName} ${a.doctorIdUser.lastName}`
                        : t("PatientAppointmentsHistory.labels.unknownDoctor")}
                    </h3>
                  </div>

                  {/* Meta */}
                  <div className="hi-meta">
                    <span className="hi-meta-item">
                      <FaCalendarAlt />
                      <span className="hi-meta-value">
                        {new Date(a.startsAt).toLocaleDateString(locale)}
                      </span>
                    </span>
                    <span className="hi-meta-item">
                      <FaClock />
                      <span className="hi-meta-value">
                        {new Date(a.startsAt).toLocaleTimeString(locale)}
                      </span>
                    </span>
                    <span className="hi-meta-item">
                      <span className="hi-meta-label">
                        {t("PatientAppointmentsHistory.labels.type")}:
                      </span>
                      <span className="hi-type-pill">{a.type || "—"}</span>
                    </span>
                  </div>
                </div>

                {/* Side: status + action */}
                <div className="hi-card-side">
                  <span className={`hi-status-badge ${sKey}`}>
                    {t(`PatientAppointmentsHistory.statuses.${sKey}`)}
                  </span>

                  {isActionable && (
                    <button
                      type="button"
                      className="hi-btn hi-btn-cancel"
                      disabled={isLoadingThis}
                      onClick={() => handleCancel(a)}
                    >
                      {isLoadingThis ? (
                        <>
                          <span className="hi-btn-spinner" />
                          {t("PatientAppointmentsHistory.actions.cancelling")}
                        </>
                      ) : (
                        <>
                          <FaTimesCircle />
                          {t("PatientAppointmentsHistory.actions.cancel")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
