// MyDoctors.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ====================== Иконки ====================== */
const IconUsers = () => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconArrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconBriefcase = () => (
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
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconStethoscope = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 2v2" />
    <path d="M5 2v2" />
    <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

/* ====================== Стили ====================== */
const MDStyles = () => (
  <style>{`
    .md-wrap {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px 20px 80px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    .md-header {
      position: relative;
      padding: 34px 36px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);
      border-radius: 20px;
      color: white;
      overflow: hidden;
      margin-bottom: 26px;
      box-shadow: 0 12px 32px -14px rgba(15, 118, 110, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .md-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .md-header-content { position: relative; z-index: 1; }
    .md-eyebrow {
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
      margin-bottom: 14px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .md-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .md-title {
      font-size: clamp(24px, 3.2vw, 32px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.15;
    }
    .md-subtitle {
      font-size: 14px;
      color: rgba(255,255,255,0.88);
      margin: 0;
      max-width: 520px;
    }
    .md-count-pill {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 12px 20px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.22);
    }
    .md-count-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .md-count-num { font-size: 22px; font-weight: 700; line-height: 1; }
    .md-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 4px;
    }

    /* ── Grid ── */
    .md-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
    }

    /* ── Card ── */
    .md-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .md-card:hover {
      border-color: #a5f3fc;
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -14px rgba(8, 145, 178, 0.25);
    }
    .md-photo-wrap {
      position: relative;
      width: 100%;
      height: 250px;
      overflow: hidden;
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      padding:15px;
    }
    .md-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
      border-radius: 10px;
    }
    .md-card:hover .md-photo { transform: scale(1.04); }
    .md-photo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.55) 0%, transparent 55%);
      pointer-events: none;
    }
    .md-added-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(34, 197, 94, 0.95);
      backdrop-filter: blur(6px);
      color: white;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .md-added-badge::before {
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
      background: white;
    }

    .md-card-body {
      padding: 18px 22px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .md-name {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }
    .md-spec {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #0e7490;
      font-weight: 600;
      background: #ecfeff;
      border: 1px solid #a5f3fc;
      padding: 4px 10px;
      border-radius: 999px;
      align-self: flex-start;
      max-width: 100%;
      overflow: hidden;
    }
    .md-spec-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .md-spec.empty {
      color: #94a3b8;
      background: #f1f5f9;
      border-color: #e2e8f0;
      font-style: italic;
      font-weight: 500;
    }

    .md-btn {
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 18px;
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
      color: white;
      text-decoration: none;
      border-radius: 11px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px -4px rgba(8, 145, 178, 0.4);
    }
    .md-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -4px rgba(8, 145, 178, 0.55);
    }
    .md-btn svg { transition: transform 0.2s ease; }
    .md-btn:hover svg { transform: translateX(3px); }

    /* ── States ── */
    .md-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 80px 20px;
      color: #64748b;
      font-size: 14px;
    }
    .md-spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: md-spin 0.8s linear infinite;
    }
    @keyframes md-spin { to { transform: rotate(360deg); } }

    .md-error {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 20px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 12px;
      color: #991b1b;
      font-size: 14px;
      font-weight: 500;
      margin: 24px 0;
    }

    /* ── Empty state ── */
    .md-empty {
      text-align: center;
      padding: 70px 30px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 20px;
      color: #64748b;
    }
    .md-empty-illustration {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 22px;
    }
    .md-empty-circle {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      border: 1px solid #a5f3fc;
    }
    .md-empty-img {
      position: relative;
      width: 110px;
      height: 110px;
      object-fit: contain;
      margin: 15px auto 0;
      display: block;
    }
    .md-empty-icon-fallback {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #0891b2;
    }
    .md-empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .md-empty-text {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 20px;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .md-wrap { padding: 20px 14px 60px; }
      .md-header { padding: 26px 22px; }
      .md-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

export default function MyDoctors() {
  const { t, i18n } = useTranslation("PatuentTranslate");

  /* ── язык / направление текста ── */
  const currentLang = (i18n.language || "ru").split("-")[0];
  const isRTL = currentLang === "ar";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  // В error теперь храним i18n-ключ (или null) — текст берём через t() в рендере,
  // чтобы при переключении языка сообщение автоматически перевелось.
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_BASE}/patient-profile/get-my-doctors`,
        {
          withCredentials: true,
          // кэш-бастинг
          params: { t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        },
      );
      setDoctors(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("❌ Ошибка загрузки докторов:", err);
      setError("myDoctors.error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();

    // событие из DoctorDetail (CustomEvent с detail)
    const onChanged = (e) => {
      // Всегда пробуем рефетч (сервер — источник истины)
      fetchDoctors();

      // И сразу оптимистично правим локально (на случай кэша/задержек)
      const detail = e?.detail || {};
      if (detail.action === "removed") {
        const u = String(detail.userId || "");
        const p = String(detail.profileId || "");
        setDoctors((prev) =>
          prev.filter(
            (d) =>
              String(d.userId || "") !== u && String(d.profileId || "") !== p,
          ),
        );
      }
      if (detail.action === "added") {
        // можно ничего не делать — рефетч подхватит
        // или показать всплывашку/микро-стейт
      }
    };

    // при возврате на вкладку/из bfcache делаем рефетч
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchDoctors();
    };
    const onFocus = () => fetchDoctors();
    const onPageShow = (e) => {
      // если страница восстановилась из bfcache — тоже рефетч
      if (e.persisted) fetchDoctors();
    };

    window.addEventListener("my-doctors:changed", onChanged);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("my-doctors:changed", onChanged);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [fetchDoctors]);

  if (loading) {
    return (
      <div className="md-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MDStyles />
        <div className="md-loading">
          <span className="md-spinner" />
          <p style={{ margin: 0 }}>{t("myDoctors.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="md-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MDStyles />
        <div className="md-error" role="alert">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{t(error)}</span>
        </div>
      </div>
    );
  }

  if (!doctors.length) {
    return (
      <div className="md-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MDStyles />
        <div className="md-empty">
          <div className="md-empty-illustration">
            <div className="md-empty-circle" />
            <img
              src="/uploads/empty-doctors.png"
              alt={t("myDoctors.empty.imgAlt")}
              className="md-empty-img"
              onError={(e) => {
                e.currentTarget.src = "/uploads/default.png";
              }}
            />
          </div>
          <div className="md-empty-title">{t("myDoctors.empty.title")}</div>
          <p className="md-empty-text">{t("myDoctors.empty.text")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <MDStyles />

      {/* ── Hero header ── */}
      <div className="md-header">
        <div className="md-header-content">
          <div className="md-eyebrow">
            <span className="dot" />
            {t("myDoctors.header.eyebrow")}
          </div>
          <h1 className="md-title">{t("myDoctors.header.title")}</h1>
          <p className="md-subtitle">{t("myDoctors.header.subtitle")}</p>
        </div>
        <div className="md-count-pill">
          <div className="md-count-icon">
            <IconUsers />
          </div>
          <div>
            <div className="md-count-num">{doctors.length}</div>
            <div className="md-count-label">
              {t("myDoctors.header.countLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="md-grid">
        {doctors.map((doctor) => {
          const fullName =
            `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
          return (
            <article
              key={doctor.profileId || doctor.userId}
              className="md-card"
            >
              <div className="md-photo-wrap">
                <img
                  src={doctor.profileImage}
                  alt={t("myDoctors.card.photoAlt", { name: fullName })}
                  className="md-photo"
                  onError={(e) => {
                    e.currentTarget.src = "/uploads/default.png";
                  }}
                />
                <div className="md-photo-overlay" />
                <span className="md-added-badge">
                  {t("myDoctors.card.addedBadge")}
                </span>
              </div>

              <div className="md-card-body">
                <h3 className="md-name">
                  {doctor.firstName} {doctor.lastName}
                </h3>

                {doctor.specialization ? (
                  <span className="md-spec">
                    <IconBriefcase />
                    <span className="md-spec-text">
                      {doctor.specialization}
                    </span>
                  </span>
                ) : (
                  <span className="md-spec empty">
                    <IconBriefcase />
                    <span className="md-spec-text">
                      {t("myDoctors.card.specialtyFallback")}
                    </span>
                  </span>
                )}

                <Link
                  to={`/patient/doctor-details/${doctor.profileId}`}
                  className="md-btn"
                >
                  {t("myDoctors.card.button")}
                  <IconArrow />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
