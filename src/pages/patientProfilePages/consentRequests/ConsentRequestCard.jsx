// ConsentRequestCard.jsx
// Sprint 3.2 — карточка одного pending consent-запроса.
// Показывает: clinic, requested scopes (в виде чипов), message (если есть), expiresAt.
// Actions: [Разрешить всё] [Гранулярно…] [Отклонить]

import React from "react";
import { useTranslation } from "react-i18next";

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
  </svg>
);

const IconClock = () => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMessage = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
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
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ====================== Helpers ====================== */

// 7 scope keys (backend names) → i18n keys
const SCOPE_LABELS = {
  encounters: "consentRequests.scopes.encounters",
  allergies: "consentRequests.scopes.allergies",
  chronicDiseases: "consentRequests.scopes.chronicDiseases",
  operations: "consentRequests.scopes.operations",
  familyHistory: "consentRequests.scopes.familyHistory",
  immunization: "consentRequests.scopes.immunization",
  imaging: "consentRequests.scopes.imaging",
};

// Defaults for scope labels (if i18n key missing)
const SCOPE_DEFAULTS = {
  encounters: "Приёмы и диагнозы",
  allergies: "Аллергии",
  chronicDiseases: "Хронические заболевания",
  operations: "Операции",
  familyHistory: "Семейный анамнез",
  immunization: "Прививки",
  imaging: "Снимки (КТ/МРТ/УЗИ)",
};

function getRequestedScopeKeys(requestedScopes) {
  if (!requestedScopes || typeof requestedScopes !== "object") return [];
  return Object.keys(SCOPE_LABELS).filter((k) => Boolean(requestedScopes[k]));
}

function formatExpiresAt(isoString, locale = "ru") {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { expired: true, text: null };
    if (diffDays === 0) return { expired: false, text: "today", days: 0 };
    return { expired: false, text: null, days: diffDays };
  } catch {
    return null;
  }
}

/* ====================== Styles ====================== */
const CardStyles = () => (
  <style>{`
    .crc-card {
      background: white;
      border-radius: 16px;
      padding: 22px 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(15,23,42,0.04);
      transition: box-shadow 0.2s;
    }
    .crc-card:hover {
      box-shadow: 0 4px 12px rgba(15,23,42,0.08);
    }

    .crc-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .crc-clinic-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #ddd6fe 0%, #c7d2fe 100%);
      color: #6366f1;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .crc-clinic-info {
      flex: 1;
      min-width: 0;
    }
    .crc-clinic-name {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .crc-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      color: #64748b;
      flex-wrap: wrap;
    }
    .crc-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .crc-meta-item.warn { color: #c2410c; font-weight: 500; }

    /* ── Scope chips ── */
    .crc-scopes-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }
    .crc-scopes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }
    .crc-scope-chip {
      padding: 5px 11px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      font-size: 12px;
      color: #334155;
      font-weight: 500;
    }

    /* ── Message ── */
    .crc-message {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .crc-message-icon {
      color: #6366f1;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .crc-message-text {
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
      word-break: break-word;
    }

    /* ── Actions ── */
    .crc-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .crc-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .crc-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .crc-btn-primary {
      background: #16a34a;
      color: white;
    }
    .crc-btn-primary:hover:not(:disabled) {
      background: #15803d;
    }
    .crc-btn-secondary {
      background: white;
      color: #4f46e5;
      border-color: #c7d2fe;
    }
    .crc-btn-secondary:hover:not(:disabled) {
      background: #eef2ff;
    }
    .crc-btn-danger {
      background: white;
      color: #dc2626;
      border-color: #fecaca;
    }
    .crc-btn-danger:hover:not(:disabled) {
      background: #fef2f2;
    }

    @media (max-width: 540px) {
      .crc-actions { flex-direction: column; }
      .crc-btn { width: 100%; justify-content: center; }
    }
  `}</style>
);

/* ====================== Main component ====================== */
export default function ConsentRequestCard({
  request,
  busy,
  onApproveAll,
  onOpenGranular,
  onReject,
}) {
  const { t, i18n } = useTranslation("PatuentTranslate");

  const clinic = request?.clinicId || {};
  const clinicName =
    clinic?.name || t("consentRequests.unknownClinic", "Клиника");

  const requestedKeys = getRequestedScopeKeys(request?.requestedScopes);
  const message = request?.message;
  const expiresAtInfo = formatExpiresAt(request?.expiresAt, i18n.language);

  return (
    <>
      <CardStyles />
      <div className="crc-card">
        {/* Header: clinic name + meta */}
        <div className="crc-head">
          <div className="crc-clinic-icon">
            <IconBuilding />
          </div>
          <div className="crc-clinic-info">
            <div className="crc-clinic-name">{clinicName}</div>
            <div className="crc-meta">
              {expiresAtInfo && expiresAtInfo.days > 0 && (
                <span
                  className={`crc-meta-item ${
                    expiresAtInfo.days <= 3 ? "warn" : ""
                  }`}
                >
                  <IconClock />
                  {t("consentRequests.expiresIn", "Истекает через")}{" "}
                  {expiresAtInfo.days} {t("consentRequests.days", "дн.")}
                </span>
              )}
              {expiresAtInfo && expiresAtInfo.days === 0 && (
                <span className="crc-meta-item warn">
                  <IconClock />
                  {t("consentRequests.expiresToday", "Истекает сегодня")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Requested scopes */}
        <div className="crc-scopes-label">
          {t("consentRequests.requestedAccess", "Запрашивает доступ к:")}
        </div>
        <div className="crc-scopes">
          {requestedKeys.map((key) => (
            <span key={key} className="crc-scope-chip">
              {t(SCOPE_LABELS[key], SCOPE_DEFAULTS[key])}
            </span>
          ))}
        </div>

        {/* Optional message from clinic */}
        {message && (
          <div className="crc-message">
            <div className="crc-message-icon">
              <IconMessage />
            </div>
            <div className="crc-message-text">{message}</div>
          </div>
        )}

        {/* Actions */}
        <div className="crc-actions">
          <button
            className="crc-btn crc-btn-primary"
            onClick={onApproveAll}
            disabled={busy}
          >
            <IconCheck />
            {t("consentRequests.approveAll", "Разрешить всё")}
          </button>
          <button
            className="crc-btn crc-btn-secondary"
            onClick={onOpenGranular}
            disabled={busy}
          >
            <IconSettings />
            {t("consentRequests.approveGranular", "Гранулярно…")}
          </button>
          <button
            className="crc-btn crc-btn-danger"
            onClick={onReject}
            disabled={busy}
          >
            <IconX />
            {t("consentRequests.reject", "Отклонить")}
          </button>
        </div>
      </div>
    </>
  );
}
