// client/src/pages/clinic/ClinicPatientDetailPage/ConsentRequestModal.jsx
//
// Sprint 3.2 (Pull Consent) — clinic-side modal.
// Позволяет клиническому сотруднику запросить у пациента доступ
// к группам медицинских данных.
//
// 3 UI группы маппятся на 7 backend scope-полей PatientConsent:
//   - appointments       → encounters
//   - healthProfile      → allergies + chronicDiseases + operations + familyHistory + immunization
//   - imaging            → imaging
//
// При submit вызывается createConsentRequest(cardId, payload).
// Backend требует чтобы card была linked to a DocPats user — иначе 422.
// Frontend ещё раньше блокирует кнопку открытия модалки если !linkedUserId.

import React, { useState, useEffect } from "react";
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

const ALL_GROUPS_TRUE = {
  appointments: true,
  healthProfile: true,
  imaging: true,
};

function scopesFromGroups(groups) {
  const scopes = {
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
      scopes[field] = true;
    });
  });
  return scopes;
}

/* ====================== Group config ====================== */
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
    titleKey: "consentRequestModal.groups.appointments.title",
    titleDefault: "Приёмы и диагнозы",
    descKey: "consentRequestModal.groups.appointments.desc",
    descDefault: "История визитов, жалобы, диагнозы, рекомендации",
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
    titleKey: "consentRequestModal.groups.healthProfile.title",
    titleDefault: "Профиль здоровья",
    descKey: "consentRequestModal.groups.healthProfile.desc",
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
    titleKey: "consentRequestModal.groups.imaging.title",
    titleDefault: "Снимки и исследования",
    descKey: "consentRequestModal.groups.imaging.desc",
    descDefault: "КТ, МРТ, УЗИ, рентген",
  },
];

/* ====================== Styles ====================== */
const ModalStyles = () => (
  <style>{`
    .crm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: crm-fade-in 0.2s ease-out;
      padding: 16px;
    }
    @keyframes crm-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .crm-modal {
      background: white;
      border-radius: 20px;
      max-width: 560px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      animation: crm-slide-in 0.25s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @keyframes crm-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .crm-header {
      padding: 24px 28px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .crm-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin: 0 0 4px 0;
    }
    .crm-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .crm-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      flex-shrink: 0;
      transition: color 0.15s;
    }
    .crm-close:hover { color: #475569; }

    .crm-body {
      padding: 20px 28px;
    }
    .crm-section-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 10px;
    }
    .crm-groups {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .crm-group {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s;
      background: white;
    }
    .crm-group.selected {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .crm-group-icon {
      color: #6366f1;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .crm-group-text { flex: 1; min-width: 0; }
    .crm-group-title {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 3px 0;
    }
    .crm-group-desc {
      font-size: 12.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
    .crm-checkbox {
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
    .crm-group.selected .crm-checkbox {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }

    /* Message field */
    .crm-message-wrap {
      margin-top: 4px;
    }
    .crm-message-label {
      display: block;
      font-size: 13px;
      color: #334155;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .crm-message-input {
      width: 100%;
      min-height: 80px;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-family: inherit;
      font-size: 13.5px;
      resize: vertical;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .crm-message-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }
    .crm-message-count {
      font-size: 11px;
      color: #94a3b8;
      text-align: right;
      margin-top: 4px;
    }

    /* HIPAA hint */
    .crm-hint {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 6px;
      margin-top: 14px;
      font-size: 12.5px;
      color: #78350f;
      line-height: 1.5;
    }

    /* Error */
    .crm-error {
      background: #fee2e2;
      border-left: 3px solid #ef4444;
      padding: 10px 14px;
      border-radius: 6px;
      margin-top: 14px;
      font-size: 13px;
      color: #7f1d1d;
    }

    /* Footer */
    .crm-footer {
      padding: 16px 28px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .crm-btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .crm-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .crm-btn-cancel {
      background: white;
      color: #475569;
      border-color: #e2e8f0;
    }
    .crm-btn-cancel:hover:not(:disabled) {
      background: #f8fafc;
    }
    .crm-btn-submit {
      background: #6366f1;
      color: white;
    }
    .crm-btn-submit:hover:not(:disabled) {
      background: #4f46e5;
    }

    @media (max-width: 540px) {
      .crm-modal { border-radius: 16px; }
      .crm-header, .crm-body, .crm-footer { padding-left: 18px; padding-right: 18px; }
      .crm-footer { flex-direction: column-reverse; }
      .crm-btn { width: 100%; }
    }
  `}</style>
);

/* ====================== Component ====================== */
export default function ConsentRequestModal({
  open,
  onClose,
  onSubmit, // (payload) => Promise — parent calls createConsentRequest
  patientName, // string, для шапки модалки
}) {
  const { t } = useTranslation();

  const [groups, setGroups] = useState(ALL_GROUPS_TRUE);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setGroups(ALL_GROUPS_TRUE);
      setMessage("");
      setErrorKey(null);
      setSubmitting(false);
    }
  }, [open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  const toggle = (groupKey) => {
    setGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleSubmit = async () => {
    const anyTrue = Object.values(groups).some(Boolean);
    if (!anyTrue) {
      setErrorKey("consentRequestModal.errors.zeroGroups");
      return;
    }

    setErrorKey(null);
    setSubmitting(true);

    const payload = {
      requestedScopes: scopesFromGroups(groups),
    };
    const trimmedMsg = message.trim();
    if (trimmedMsg) {
      payload.message = trimmedMsg.slice(0, 500);
    }

    try {
      await onSubmit(payload);
      // parent will close modal on success
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        setErrorKey("consentRequestModal.errors.rateLimit");
      } else if (status === 422) {
        setErrorKey("consentRequestModal.errors.notLinked");
      } else {
        setErrorKey("consentRequestModal.errors.generic");
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalStyles />
      <div className="crm-overlay" onClick={handleOverlayClick}>
        <div className="crm-modal" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="crm-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="crm-title">
                {t("consentRequestModal.title", "Запрос доступа к медданным")}
              </h2>
              <p className="crm-subtitle">
                {patientName
                  ? t("consentRequestModal.subtitleFor", {
                      defaultValue: "Пациент: {{name}}",
                      name: patientName,
                    })
                  : t(
                      "consentRequestModal.subtitle",
                      "Запрос будет отправлен пациенту в его кабинет.",
                    )}
              </p>
            </div>
            <button
              className="crm-close"
              onClick={onClose}
              disabled={submitting}
              aria-label={t("consentRequestModal.close", "Закрыть")}
              type="button"
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
          <div className="crm-body">
            <div className="crm-section-label">
              {t("consentRequestModal.requestedAccess", "Запросить доступ к:")}
            </div>

            <div className="crm-groups">
              {GROUP_CONFIG.map((g) => (
                <div
                  key={g.key}
                  className={`crm-group ${groups[g.key] ? "selected" : ""}`}
                  onClick={() => !submitting && toggle(g.key)}
                >
                  <div className="crm-group-icon">{g.icon}</div>
                  <div className="crm-group-text">
                    <h3 className="crm-group-title">
                      {t(g.titleKey, g.titleDefault)}
                    </h3>
                    <p className="crm-group-desc">
                      {t(g.descKey, g.descDefault)}
                    </p>
                  </div>
                  <div className="crm-checkbox">
                    {groups[g.key] && (
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
              ))}
            </div>

            <div className="crm-message-wrap">
              <label className="crm-message-label" htmlFor="crm-msg">
                {t(
                  "consentRequestModal.messageLabel",
                  "Сообщение пациенту (необязательно)",
                )}
              </label>
              <textarea
                id="crm-msg"
                className="crm-message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder={t(
                  "consentRequestModal.messagePlaceholder",
                  "Например: для подготовки к консультации мне нужны ваши результаты КТ",
                )}
                disabled={submitting}
              />
              <div className="crm-message-count">{message.length} / 500</div>
            </div>

            {/* HIPAA hint */}
            <div className="crm-hint">
              {t(
                "consentRequestModal.hint",
                "Пациент получит уведомление с названием вашей клиники и запрошенными группами данных. Он сможет одобрить запрос целиком, частично, или отклонить.",
              )}
            </div>

            {errorKey && (
              <div className="crm-error">
                {errorKey === "consentRequestModal.errors.rateLimit"
                  ? t(
                      errorKey,
                      "У вас уже 3 активных запроса этому пациенту. Дождитесь ответа или отмените существующие.",
                    )
                  : errorKey === "consentRequestModal.errors.notLinked"
                    ? t(
                        errorKey,
                        "Карта пациента не связана с аккаунтом DocPats. Свяжите карту перед отправкой запроса.",
                      )
                    : errorKey === "consentRequestModal.errors.zeroGroups"
                      ? t(errorKey, "Выберите хотя бы одну группу данных.")
                      : t(
                          errorKey,
                          "Не удалось отправить запрос. Попробуйте позже.",
                        )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="crm-footer">
            <button
              className="crm-btn crm-btn-cancel"
              onClick={onClose}
              disabled={submitting}
              type="button"
            >
              {t("consentRequestModal.cancel", "Отмена")}
            </button>
            <button
              className="crm-btn crm-btn-submit"
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
            >
              {submitting
                ? t("consentRequestModal.submitting", "Отправка…")
                : t("consentRequestModal.submit", "Отправить запрос")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
