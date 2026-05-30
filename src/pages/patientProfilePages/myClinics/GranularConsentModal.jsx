// GranularConsentModal.jsx
// Sprint 3.1 — модалка для гранулярного выбора scope.
//
// 3 UI группы маппятся на 7 scope-полей PatientConsent:
//   - "appointments" → encounters
//   - "healthProfile" → allergies + chronicDiseases + familyHistory + immunization
//   - "imaging" → imaging + operations
//
// При открытии: если consent уже есть, заполняем чекбоксы из существующих scopes.
// "Применить" вызывает onApply(scopes) — родитель шлёт на бэкенд.

import React, { useState, useEffect } from "react";

/* Icons */
const IconX = () => (
  <svg
    width="18"
    height="18"
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
const IconClipboard = () => (
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
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);
const IconHeart = () => (
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
);
const IconScan = () => (
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
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="8" width="10" height="8" rx="1" />
  </svg>
);
const IconShieldCheck = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/* Styles */
const ModalStyles = () => (
  <style>{`
    .gc-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 9998;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 20px;
      overflow-y: auto;
      animation: gc-fade 0.2s ease;
    }
    @keyframes gc-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .gc-dialog {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 560px;
      box-shadow: 0 24px 64px -16px rgba(15, 23, 42, 0.35);
      overflow: hidden;
      animation: gc-slide 0.25s ease;
    }
    @keyframes gc-slide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .gc-header {
      padding: 22px 26px 18px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }
    .gc-title {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      line-height: 1.25;
    }
    .gc-clinic {
      font-size: 13px;
      color: #6366f1;
      font-weight: 600;
    }
    .gc-close {
      width: 36px; height: 36px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .gc-close:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .gc-body {
      padding: 22px 26px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .gc-intro {
      font-size: 13.5px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 18px;
    }
    .gc-group {
      display: flex;
      gap: 14px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .gc-group:hover {
      border-color: #c7d2fe;
      background: #fafafe;
    }
    .gc-group.active {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
    }
    .gc-group-icon {
      width: 42px; height: 42px;
      border-radius: 11px;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .gc-group.active .gc-group-icon {
      background: linear-gradient(135deg, #ede9fe 0%, #cffafe 100%);
      color: #6366f1;
    }
    .gc-group-text {
      flex: 1;
      min-width: 0;
    }
    .gc-group-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 3px;
      line-height: 1.3;
    }
    .gc-group-desc {
      font-size: 12.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .gc-checkbox {
      width: 22px; height: 22px;
      border-radius: 6px;
      border: 2px solid #cbd5e1;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
      color: white;
    }
    .gc-group.active .gc-checkbox {
      background: #6366f1;
      border-color: #6366f1;
    }
    .gc-checkbox svg {
      opacity: 0;
      transition: opacity 0.15s;
    }
    .gc-group.active .gc-checkbox svg { opacity: 1; }

    .gc-footer {
      padding: 18px 26px 22px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .gc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 11px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      font-family: inherit;
      transition: all 0.2s;
    }
    .gc-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .gc-btn.ghost {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .gc-btn.ghost:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .gc-btn.primary {
      background: linear-gradient(135deg, #6366f1 0%, #0891b2 100%);
      color: white;
      box-shadow: 0 4px 12px -4px rgba(99, 102, 241, 0.5);
    }
    .gc-btn.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.6);
    }

    @media (max-width: 520px) {
      .gc-overlay { padding: 16px; }
      .gc-header, .gc-body, .gc-footer { padding-left: 18px; padding-right: 18px; }
    }
  `}</style>
);

/**
 * 3 UI groups → 7 backend scope fields.
 * Used both ways: derive initial group state from existing consent,
 * and serialize chosen groups back to flat scopes for API.
 */
const GROUP_TO_SCOPES = {
  appointments: ["encounters"],
  healthProfile: [
    "allergies",
    "chronicDiseases",
    "familyHistory",
    "immunization",
  ],
  imaging: ["imaging", "operations"],
};

function groupsFromScopes(scopes) {
  if (!scopes) {
    return { appointments: false, healthProfile: false, imaging: false };
  }
  return {
    // group is active if AT LEAST ONE of its backend fields is true
    appointments: GROUP_TO_SCOPES.appointments.some((k) => Boolean(scopes[k])),
    healthProfile: GROUP_TO_SCOPES.healthProfile.some((k) =>
      Boolean(scopes[k]),
    ),
    imaging: GROUP_TO_SCOPES.imaging.some((k) => Boolean(scopes[k])),
  };
}

function scopesFromGroups(groups) {
  // start with all 7 fields false
  const scopes = {
    encounters: false,
    allergies: false,
    chronicDiseases: false,
    operations: false,
    familyHistory: false,
    immunization: false,
    imaging: false,
  };
  Object.entries(groups).forEach(([groupName, on]) => {
    if (!on) return;
    (GROUP_TO_SCOPES[groupName] || []).forEach((field) => {
      scopes[field] = true;
    });
  });
  return scopes;
}

export default function GranularConsentModal({
  item,
  onClose,
  onApply,
  t,
  isRTL,
}) {
  const { clinic, consent } = item || {};

  const [groups, setGroups] = useState(() => groupsFromScopes(consent?.scopes));
  const [submitting, setSubmitting] = useState(false);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    // prevent body scroll
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = origOverflow;
    };
  }, [onClose, submitting]);

  const toggle = (groupName) => {
    if (submitting) return;
    setGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const hasAny = Object.values(groups).some(Boolean);

  const handleApply = async () => {
    if (!hasAny) return;
    setSubmitting(true);
    try {
      await onApply(scopesFromGroups(groups));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    // close only if click on overlay itself, not inside dialog
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const groupList = [
    {
      key: "appointments",
      icon: <IconClipboard />,
      titleKey: "myClinics.granular.appointments.title",
      descKey: "myClinics.granular.appointments.desc",
    },
    {
      key: "healthProfile",
      icon: <IconHeart />,
      titleKey: "myClinics.granular.healthProfile.title",
      descKey: "myClinics.granular.healthProfile.desc",
    },
    {
      key: "imaging",
      icon: <IconScan />,
      titleKey: "myClinics.granular.imaging.title",
      descKey: "myClinics.granular.imaging.desc",
    },
  ];

  return (
    <div
      className="gc-overlay"
      onClick={handleOverlayClick}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <ModalStyles />
      <div className="gc-dialog" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="gc-header">
          <div>
            <h2 className="gc-title">{t("myClinics.granular.title")}</h2>
            <div className="gc-clinic">{clinic?.name}</div>
          </div>
          <button
            className="gc-close"
            onClick={onClose}
            disabled={submitting}
            aria-label={t("myClinics.granular.close")}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="gc-body">
          <p className="gc-intro">{t("myClinics.granular.intro")}</p>

          {groupList.map((g) => (
            <div
              key={g.key}
              className={`gc-group ${groups[g.key] ? "active" : ""}`}
              onClick={() => toggle(g.key)}
              role="checkbox"
              aria-checked={groups[g.key]}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggle(g.key);
                }
              }}
            >
              <div className="gc-group-icon">{g.icon}</div>
              <div className="gc-group-text">
                <h3 className="gc-group-title">{t(g.titleKey)}</h3>
                <p className="gc-group-desc">{t(g.descKey)}</p>
              </div>
              <div className="gc-checkbox">
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
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="gc-footer">
          <button
            className="gc-btn ghost"
            onClick={onClose}
            disabled={submitting}
          >
            {t("myClinics.granular.cancel")}
          </button>
          <button
            className="gc-btn primary"
            onClick={handleApply}
            disabled={submitting || !hasAny}
          >
            <IconShieldCheck />
            {submitting
              ? t("myClinics.granular.applying")
              : t("myClinics.granular.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
