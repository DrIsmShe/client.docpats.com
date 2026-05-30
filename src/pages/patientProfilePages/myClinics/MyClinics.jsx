// MyClinics.jsx
// Sprint 3.1 — PatientConsent UI MVP.
// Список клиник пациента с управлением consent'ами.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getMyClinics,
  grantConsent,
  updateConsentScopes,
  revokeConsent,
} from "../../../api/patient";
import ClinicConsentCard from "./ClinicConsentCard";
import GranularConsentModal from "./GranularConsentModal";

/* ====================== Иконки ====================== */
const IconBuilding = () => (
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
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

/* ====================== Стили ====================== */
const MCStyles = () => (
  <style>{`
    .mc-wrap {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px 20px 80px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    .mc-header {
      position: relative;
      padding: 34px 36px;
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 55%, #0891b2 100%);
      border-radius: 20px;
      color: white;
      overflow: hidden;
      margin-bottom: 26px;
      box-shadow: 0 12px 32px -14px rgba(99, 102, 241, 0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .mc-header::before {
      content: "";
      position: absolute;
      top: -100px; right: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .mc-header-content { position: relative; z-index: 1; }
    .mc-eyebrow {
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
    .mc-eyebrow .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }
    .mc-title {
      font-size: clamp(24px, 3.2vw, 32px);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      line-height: 1.15;
    }
    .mc-subtitle {
      font-size: 14px;
      color: rgba(255,255,255,0.88);
      margin: 0;
      max-width: 520px;
    }
    .mc-count-pill {
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
    .mc-count-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .mc-count-num { font-size: 22px; font-weight: 700; line-height: 1; }
    .mc-count-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.82);
      margin-top: 4px;
    }

    /* ── Grid ── */
    .mc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 18px;
    }

    /* ── States ── */
    .mc-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 80px 20px;
      color: #64748b;
      font-size: 14px;
    }
    .mc-spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: mc-spin 0.8s linear infinite;
    }
    @keyframes mc-spin { to { transform: rotate(360deg); } }

    .mc-error {
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

    .mc-empty {
      text-align: center;
      padding: 70px 30px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 20px;
      color: #64748b;
    }
    .mc-empty-illustration {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 22px;
    }
    .mc-empty-circle {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #faf5ff 0%, #ecfeff 100%);
      border: 1px solid #c7d2fe;
    }
    .mc-empty-icon-fallback {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #6366f1;
    }
    .mc-empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .mc-empty-text {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 20px;
      max-width: 460px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    /* Toast */
    .mc-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: white;
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 12px 32px -8px rgba(15, 23, 42, 0.4);
      animation: mc-toast-in 0.3s ease;
    }
    .mc-toast.error { background: #991b1b; }
    .mc-toast.success { background: #166534; }
    @keyframes mc-toast-in {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @media (max-width: 640px) {
      .mc-wrap { padding: 20px 14px 60px; }
      .mc-header { padding: 26px 22px; }
      .mc-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

/* ====================== Helpers ====================== */
// "Full access" — все scopes true
const ALL_SCOPES_TRUE = {
  encounters: true,
  allergies: true,
  chronicDiseases: true,
  operations: true,
  familyHistory: true,
  immunization: true,
  imaging: true,
};

/* ====================== Component ====================== */
export default function MyClinics() {
  const { t, i18n } = useTranslation("PatuentTranslate");

  const currentLang = (i18n.language || "ru").split("-")[0];
  const isRTL = currentLang === "ar";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [busyCardId, setBusyCardId] = useState(null); // блокировка во время grant/revoke

  // Granular modal state
  const [granularOpen, setGranularOpen] = useState(false);
  const [granularCard, setGranularCard] = useState(null); // {clinic, card, consent}

  // Toast
  const [toast, setToast] = useState(null); // {type, key}

  const showToast = (type, key) => {
    setToast({ type, key });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyClinics();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setErrorKey(null);
    } catch (err) {
      console.error("❌ Ошибка загрузки клиник:", err);
      setErrorKey("myClinics.error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchItems();
    };
    const onFocus = () => fetchItems();
    const onPageShow = (e) => {
      if (e.persisted) fetchItems();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [fetchItems]);

  /* ── Handlers ── */

  // "Полный доступ" — все 7 scopes true.
  const handleGrantFullAccess = async (item) => {
    if (!item?.card?._id) return;
    const cardId = item.card._id;
    setBusyCardId(cardId);
    try {
      await grantConsent({ cardId, scopes: ALL_SCOPES_TRUE });
      showToast("success", "myClinics.toasts.granted");
      await fetchItems();
    } catch (err) {
      console.error("❌ grant error:", err);
      showToast("error", "myClinics.toasts.grantError");
    } finally {
      setBusyCardId(null);
    }
  };

  // Открыть модалку для гранулярной настройки
  const handleOpenGranular = (item) => {
    setGranularCard(item);
    setGranularOpen(true);
  };

  // Применить scopes из модалки (создаёт новый consent ИЛИ merge-update в существующий)
  const handleApplyGranular = async (scopes) => {
    if (!granularCard?.card?._id) return;
    const cardId = granularCard.card._id;
    setBusyCardId(cardId);
    try {
      await grantConsent({ cardId, scopes });
      showToast("success", "myClinics.toasts.scopesUpdated");
      setGranularOpen(false);
      setGranularCard(null);
      await fetchItems();
    } catch (err) {
      console.error("❌ apply scopes error:", err);
      showToast("error", "myClinics.toasts.grantError");
    } finally {
      setBusyCardId(null);
    }
  };

  // Отзыв consent
  const handleRevoke = async (item) => {
    const consentId = item?.consent?._id;
    if (!consentId) return;
    const ok = window.confirm(t("myClinics.confirmRevoke"));
    if (!ok) return;
    setBusyCardId(item.card._id);
    try {
      await revokeConsent(consentId);
      showToast("success", "myClinics.toasts.revoked");
      await fetchItems();
    } catch (err) {
      console.error("❌ revoke error:", err);
      showToast("error", "myClinics.toasts.revokeError");
    } finally {
      setBusyCardId(null);
    }
  };

  /* ── Render ── */

  if (loading) {
    return (
      <div className="mc-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MCStyles />
        <div className="mc-loading">
          <span className="mc-spinner" />
          <p style={{ margin: 0 }}>{t("myClinics.loading")}</p>
        </div>
      </div>
    );
  }

  if (errorKey) {
    return (
      <div className="mc-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MCStyles />
        <div className="mc-error" role="alert">
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
          <span>{t(errorKey)}</span>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mc-wrap" dir={isRTL ? "rtl" : "ltr"}>
        <MCStyles />
        <div className="mc-empty">
          <div className="mc-empty-illustration">
            <div className="mc-empty-circle" />
            <div className="mc-empty-icon-fallback">
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
              </svg>
            </div>
          </div>
          <div className="mc-empty-title">{t("myClinics.empty.title")}</div>
          <p className="mc-empty-text">{t("myClinics.empty.text")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-wrap" dir={isRTL ? "rtl" : "ltr"}>
      <MCStyles />

      {/* ── Hero header ── */}
      <div className="mc-header">
        <div className="mc-header-content">
          <div className="mc-eyebrow">
            <span className="dot" />
            {t("myClinics.header.eyebrow")}
          </div>
          <h1 className="mc-title">{t("myClinics.header.title")}</h1>
          <p className="mc-subtitle">{t("myClinics.header.subtitle")}</p>
        </div>
        <div className="mc-count-pill">
          <div className="mc-count-icon">
            <IconBuilding />
          </div>
          <div>
            <div className="mc-count-num">{items.length}</div>
            <div className="mc-count-label">
              {t("myClinics.header.countLabel")}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="mc-grid">
        {items.map((item) => (
          <ClinicConsentCard
            key={item.card._id}
            item={item}
            busy={busyCardId === item.card._id}
            onGrantFull={() => handleGrantFullAccess(item)}
            onGranular={() => handleOpenGranular(item)}
            onRevoke={() => handleRevoke(item)}
            t={t}
          />
        ))}
      </div>

      {/* ── Granular modal ── */}
      {granularOpen && granularCard && (
        <GranularConsentModal
          item={granularCard}
          onClose={() => {
            setGranularOpen(false);
            setGranularCard(null);
          }}
          onApply={handleApplyGranular}
          t={t}
          isRTL={isRTL}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div className={`mc-toast ${toast.type}`}>{t(toast.key)}</div>}
    </div>
  );
}
