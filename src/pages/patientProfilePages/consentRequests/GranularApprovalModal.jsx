// GranularApprovalModal.jsx
// Sprint 3.2 — модалка для гранулярного одобрения consent-запроса.
// Mirror Sprint 3.1 GranularConsentModal.
//
// 3 UI группы маппятся на 7 scope-полей PatientConsent:
//   - appointments       → encounters
//   - healthProfile      → allergies + chronicDiseases + operations + familyHistory + immunization
//   - imaging            → imaging
//
// При открытии: чекбоксы заполнены из requestedScopes (только то что клиника просит).
// Пользователь может СНЯТЬ галки (=approve меньше) но НЕ может поставить новые.
// "Применить" вызывает onApply(approvedScopes) — родитель шлёт на бэкенд.

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

/* ====================== Group → Scopes mapping ====================== */
const GROUP_TO_SCOPES = {
  appointments: ["encounters"],
  healthProfile: [
    "allergies",
    "chronicDiseases",
    "operations",
    "familyHistory",
    "immunization",
  ],
  imaging: ["imaging"],
};

// Determine which groups have AT LEAST ONE requested scope
function groupsFromRequested(requestedScopes) {
  if (!requestedScopes)
    return { appointments: false, healthProfile: false, imaging: false };
  return {
    appointments: GROUP_TO_SCOPES.appointments.some((k) =>
      Boolean(requestedScopes[k]),
    ),
    healthProfile: GROUP_TO_SCOPES.healthProfile.some((k) =>
      Boolean(requestedScopes[k]),
    ),
    imaging: GROUP_TO_SCOPES.imaging.some((k) => Boolean(requestedScopes[k])),
  };
}

// Convert UI groups → flat backend scopes, BUT only those that were originally requested
function approvedScopesFromGroups(groups, requestedScopes) {
  const result = {
    encounters: false,
    allergies: false,
    chronicDiseases: false,
    operations: false,
    familyHistory: false,
    immunization: false,
    imaging: false,
  };
  Object.entries(groups).forEach(([groupName, enabled]) => {
    if (!enabled) return;
    (GROUP_TO_SCOPES[groupName] || []).forEach((field) => {
      // Only allow approving scopes that were actually requested
      if (requestedScopes?.[field]) {
        result[field] = true;
      }
    });
  });
  return result;
}

/* ====================== Group icons + labels ====================== */
const GROUP_CONFIG = [
  {
    key: "appointments",
    icon: (
      <svg
        width="22"
        height="22"
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
    titleKey: "consentRequests.groups.appointments.title",
    titleDefault: "Приёмы и диагнозы",
    descKey: "consentRequests.groups.appointments.desc",
    descDefault: "История посещений врача, жалобы, диагнозы, рекомендации",
  },
  {
    key: "healthProfile",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    titleKey: "consentRequests.groups.healthProfile.title",
    titleDefault: "Профиль здоровья",
    descKey: "consentRequests.groups.healthProfile.desc",
    descDefault:
      "Аллергии, хронические заболевания, операции, прививки, семейный анамнез",
  },
  {
    key: "imaging",
    icon: (
      <svg
        width="22"
        height="22"
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
    titleKey: "consentRequests.groups.imaging.title",
    titleDefault: "Снимки и исследования",
    descKey: "consentRequests.groups.imaging.desc",
    descDefault: "КТ, МРТ, УЗИ, рентген и другие изображения",
  },
];

/* ====================== Styles ====================== */
const ModalStyles = () => (
  <style>{`
    .gam-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: gam-fade-in 0.2s ease-out;
      padding: 16px;
    }
    @keyframes gam-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .gam-modal {
      background: white;
      border-radius: 20px;
      max-width: 560px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      animation: gam-slide-in 0.25s ease-out;
    }
    @keyframes gam-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .gam-header {
      padding: 24px 28px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .gam-header-text {
      flex: 1;
      min-width: 0;
    }
    .gam-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin: 0 0 4px 0;
    }
    .gam-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .gam-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      flex-shrink: 0;
      transition: color 0.15s;
    }
    .gam-close:hover {
      color: #475569;
    }

    .gam-body {
      padding: 20px 28px;
    }
    .gam-groups {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .gam-group {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.15s;
      background: white;
    }
    .gam-group.selected {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .gam-group.disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .gam-group-icon {
      color: #6366f1;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .gam-group-text {
      flex: 1;
      min-width: 0;
    }
    .gam-group-title {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 3px 0;
    }
    .gam-group-desc {
      font-size: 12.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .gam-checkbox {
      width: 22px;
      height: 22px;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      background: white;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      margin-top: 1px;
    }
    .gam-group.selected .gam-checkbox {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }
    .gam-group.disabled .gam-checkbox {
      background: #f1f5f9;
      border-color: #e2e8f0;
    }

    .gam-not-requested {
      font-size: 11px;
      color: #94a3b8;
      font-style: italic;
      margin-top: 4px;
    }

    /* ── Footer ── */
    .gam-footer {
      padding: 16px 28px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .gam-btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .gam-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .gam-btn-cancel {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .gam-btn-cancel:hover:not(:disabled) {
      background: #f8fafc;
    }
    .gam-btn-apply {
      background: #16a34a;
      color: white;
    }
    .gam-btn-apply:hover:not(:disabled) {
      background: #15803d;
    }

    @media (max-width: 540px) {
      .gam-modal { max-width: none; border-radius: 16px; }
      .gam-header, .gam-body, .gam-footer { padding-left: 18px; padding-right: 18px; }
      .gam-footer { flex-direction: column-reverse; }
      .gam-btn { width: 100%; }
    }
  `}</style>
);

/* ====================== Component ====================== */
export default function GranularApprovalModal({ request, onClose, onApply }) {
  const { t } = useTranslation("PatuentTranslate");

  const requestedScopes = useMemo(
    () => request?.requestedScopes || {},
    [request],
  );

  // Which groups are actually requested by clinic (=available for approval)
  const availableGroups = useMemo(
    () => groupsFromRequested(requestedScopes),
    [requestedScopes],
  );

  // Selected state: start = all available are checked (default "approve all requested")
  const [groups, setGroups] = useState(() => ({ ...availableGroups }));
  const [submitting, setSubmitting] = useState(false);

  // ESC closes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  const toggle = (groupKey) => {
    // Only allow toggling groups that were requested
    if (!availableGroups[groupKey]) return;
    setGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleApply = async () => {
    const approvedScopes = approvedScopesFromGroups(groups, requestedScopes);
    const anyTrue = Object.values(approvedScopes).some(Boolean);
    if (!anyTrue) {
      // Zero scopes — backend will return 422. UI gives clearer message.
      alert(
        t(
          "consentRequests.modal.zeroScopesAlert",
          "Выберите хотя бы одну группу или отклоните запрос.",
        ),
      );
      return;
    }
    setSubmitting(true);
    try {
      await onApply(approvedScopes);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalStyles />
      <div className="gam-overlay" onClick={handleOverlayClick}>
        <div className="gam-modal" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="gam-header">
            <div className="gam-header-text">
              <h2 className="gam-title">
                {t("consentRequests.modal.title", "Гранулярный доступ")}
              </h2>
              <p className="gam-subtitle">
                {t(
                  "consentRequests.modal.subtitle",
                  "Выберите, какие группы данных разрешить. Снимите галку — и клиника не увидит эту группу.",
                )}
              </p>
            </div>
            <button
              className="gam-close"
              onClick={onClose}
              disabled={submitting}
              aria-label={t("consentRequests.modal.close", "Закрыть")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="gam-body">
            <div className="gam-groups">
              {GROUP_CONFIG.map((g) => {
                const isAvailable = availableGroups[g.key];
                const isSelected = isAvailable && groups[g.key];
                return (
                  <div
                    key={g.key}
                    className={`gam-group ${isSelected ? "selected" : ""} ${
                      !isAvailable ? "disabled" : ""
                    }`}
                    onClick={() => toggle(g.key)}
                  >
                    <div className="gam-group-icon">{g.icon}</div>
                    <div className="gam-group-text">
                      <h3 className="gam-group-title">
                        {t(g.titleKey, g.titleDefault)}
                      </h3>
                      <p className="gam-group-desc">
                        {t(g.descKey, g.descDefault)}
                      </p>
                      {!isAvailable && (
                        <div className="gam-not-requested">
                          {t(
                            "consentRequests.modal.notRequested",
                            "Не запрашивается этой клиникой",
                          )}
                        </div>
                      )}
                    </div>
                    <div className="gam-checkbox">
                      {isSelected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="gam-footer">
            <button
              className="gam-btn gam-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {t("consentRequests.modal.cancel", "Отмена")}
            </button>
            <button
              className="gam-btn gam-btn-apply"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting
                ? t("consentRequests.modal.applying", "Применение…")
                : t("consentRequests.modal.apply", "Применить")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
