// ConsentRequests.jsx
// Sprint 3.2 — Pull Consent (patient side).
// Список pending consent-запросов от клиник с возможностью approve/reject.

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getMyConsentRequests,
  approveConsentRequest,
  rejectConsentRequest,
} from "../../../api/patient";
import ConsentRequestCard from "./ConsentRequestCard";
import GranularApprovalModal from "./GranularApprovalModal";

/* ====================== Иконки ====================== */
const IconInbox = () => (
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
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const IconInboxEmpty = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

/* ====================== Стили ====================== */
const CRStyles = () => (
  <style>{`
    .cr-wrap {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px 20px 80px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ── */
    .cr-header {
      position: relative;
      padding: 34px 36px;
      background: linear-gradient(135deg, #0891b2 0%, #6366f1 55%, #7c3aed 100%);
      border-radius: 20px;
      color: white;
      overflow: hidden;
      margin-bottom: 26px;
      box-shadow: 0 12px 32px -14px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .cr-header-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.18);
      border-radius: 12px;
      backdrop-filter: blur(8px);
    }
    .cr-header-text {
      flex: 1;
      min-width: 0;
    }
    .cr-header h1 {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .cr-header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.92;
      line-height: 1.5;
    }
    .cr-header-bg {
      position: absolute;
      right: -40px;
      top: -40px;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
      pointer-events: none;
    }

    /* ── Body ── */
    .cr-body { min-height: 200px; }

    .cr-loading,
    .cr-error,
    .cr-empty {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
      font-size: 15px;
    }
    .cr-error { color: #dc2626; }
    .cr-empty-icon {
      color: #cbd5e1;
      margin-bottom: 16px;
    }
    .cr-empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .cr-empty-text {
      font-size: 14px;
      color: #64748b;
      max-width: 360px;
      margin: 0 auto;
    }

    .cr-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Toast ── */
    .cr-toast {
      position: fixed;
      bottom: 28px;
      right: 28px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 12px 32px -8px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: cr-toast-in 0.3s ease-out;
      max-width: 400px;
    }
    .cr-toast.success {
      background: #dcfce7;
      color: #14532d;
      border: 1px solid #86efac;
    }
    .cr-toast.error {
      background: #fee2e2;
      color: #7f1d1d;
      border: 1px solid #fca5a5;
    }
    @keyframes cr-toast-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .cr-wrap { padding: 20px 14px 60px; }
      .cr-header {
        padding: 24px 22px;
        gap: 14px;
      }
      .cr-header h1 { font-size: 20px; }
      .cr-header p { font-size: 13px; }
    }
  `}</style>
);

/* ====================== Main component ====================== */
export default function ConsentRequests() {
  const { t } = useTranslation("PatuentTranslate");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);

  const [busyRequestId, setBusyRequestId] = useState(null);

  // Granular approval modal
  const [granularOpen, setGranularOpen] = useState(false);
  const [granularRequest, setGranularRequest] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, key) => {
    setToast({ type, key });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch ── */
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyConsentRequests();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setErrorKey(null);
    } catch (err) {
      console.error("❌ Ошибка загрузки consent-запросов:", err);
      setErrorKey("consentRequests.error");
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

  // Approve all requested scopes
  const handleApproveAll = async (request) => {
    if (!request?._id) return;
    setBusyRequestId(request._id);
    try {
      await approveConsentRequest(request._id, null);
      showToast("success", "consentRequests.toasts.approved");
      await fetchItems();
    } catch (err) {
      console.error("❌ approve all error:", err);
      const status = err?.response?.status;
      if (status === 409) {
        showToast("error", "consentRequests.toasts.notPending");
      } else {
        showToast("error", "consentRequests.toasts.approveError");
      }
    } finally {
      setBusyRequestId(null);
    }
  };

  // Открыть модалку для гранулярного approve
  const handleOpenGranular = (request) => {
    setGranularRequest(request);
    setGranularOpen(true);
  };

  // Применить approvedScopes из модалки
  const handleApplyGranular = async (approvedScopes) => {
    if (!granularRequest?._id) return;
    setBusyRequestId(granularRequest._id);
    try {
      await approveConsentRequest(granularRequest._id, approvedScopes);
      showToast("success", "consentRequests.toasts.approved");
      setGranularOpen(false);
      setGranularRequest(null);
      await fetchItems();
    } catch (err) {
      console.error("❌ approve granular error:", err);
      const status = err?.response?.status;
      if (status === 422) {
        showToast("error", "consentRequests.toasts.zeroScopes");
      } else if (status === 409) {
        showToast("error", "consentRequests.toasts.notPending");
      } else {
        showToast("error", "consentRequests.toasts.approveError");
      }
    } finally {
      setBusyRequestId(null);
    }
  };

  // Reject
  const handleReject = async (request) => {
    if (!request?._id) return;
    const confirmMsg = t("consentRequests.rejectConfirm");
    if (!window.confirm(confirmMsg)) return;
    setBusyRequestId(request._id);
    try {
      await rejectConsentRequest(request._id, null);
      showToast("success", "consentRequests.toasts.rejected");
      await fetchItems();
    } catch (err) {
      console.error("❌ reject error:", err);
      const status = err?.response?.status;
      if (status === 409) {
        showToast("error", "consentRequests.toasts.notPending");
      } else {
        showToast("error", "consentRequests.toasts.rejectError");
      }
    } finally {
      setBusyRequestId(null);
    }
  };

  /* ── Render ── */
  return (
    <>
      <CRStyles />
      <div className="cr-wrap">
        {/* Header */}
        <div className="cr-header">
          <div className="cr-header-bg" />
          <div className="cr-header-icon">
            <IconInbox />
          </div>
          <div className="cr-header-text">
            <h1>{t("consentRequests.title", "Запросы доступа")}</h1>
            <p>
              {t(
                "consentRequests.subtitle",
                "Клиники запрашивают разрешение на просмотр ваших медицинских записей. Вы решаете — давать ли доступ.",
              )}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="cr-body">
          {loading && (
            <div className="cr-loading">
              {t("consentRequests.loading", "Загрузка…")}
            </div>
          )}

          {!loading && errorKey && (
            <div className="cr-error">
              {t(errorKey, "Не удалось загрузить запросы. Попробуйте позже.")}
            </div>
          )}

          {!loading && !errorKey && items.length === 0 && (
            <div className="cr-empty">
              <div className="cr-empty-icon">
                <IconInboxEmpty />
              </div>
              <div className="cr-empty-title">
                {t("consentRequests.empty.title", "Нет запросов")}
              </div>
              <div className="cr-empty-text">
                {t(
                  "consentRequests.empty.text",
                  "Когда клиника запросит доступ к вашим медицинским данным, запрос появится здесь.",
                )}
              </div>
            </div>
          )}

          {!loading && !errorKey && items.length > 0 && (
            <div className="cr-list">
              {items.map((request) => (
                <ConsentRequestCard
                  key={request._id}
                  request={request}
                  busy={busyRequestId === request._id}
                  onApproveAll={() => handleApproveAll(request)}
                  onOpenGranular={() => handleOpenGranular(request)}
                  onReject={() => handleReject(request)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Granular approval modal */}
        {granularOpen && granularRequest && (
          <GranularApprovalModal
            request={granularRequest}
            onClose={() => {
              setGranularOpen(false);
              setGranularRequest(null);
            }}
            onApply={handleApplyGranular}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`cr-toast ${toast.type}`}>
            {t(toast.key, toast.key)}
          </div>
        )}
      </div>
    </>
  );
}
