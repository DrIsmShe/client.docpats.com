// client/src/pages/clinic/ClinicPatientsPage/ConsentConfirmationModal.jsx
//
// Modal shown when the registration wizard finds an existing DocPats User
// matching the patient's email. Receptionist must confirm that the
// patient gave consent (signed paper form / e-signature on a tablet —
// the consent flow itself is OUT of scope, this only records the fact
// of confirmation in the audit trail).
//
// Two modes — controlled by `mode` prop:
//
//   "active"      — existing User is fully activated (has their own
//                   email/password). On consent: ClinicPatient is created
//                   linked to existing User. NO new card issued — patient
//                   already knows their credentials.
//
//   "provisional" — existing User has an unactivated card (provisional)
//                   issued by some clinic in the past. On consent: a
//                   fresh tmp email + password is generated, old card
//                   stops working, new card is printed + emailed.
//
// What we show:
//   - Full firstName, lastName, dateOfBirth from the found User
//     (so receptionist can verify face-to-face that this is their patient)
//   - For "provisional" mode: when the original card was issued and how
//     many times it has been reissued (no clinic NAME — privacy)
//   - A required checkbox: "Я подтверждаю, что пациент дал согласие..."
//   - Two buttons: Confirm (disabled until checkbox ticked) / Cancel
//
// On confirm — calls onConfirm() which triggers wizard's resubmit with
// patientConsentConfirmed: true.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./consentConfirmationModal.css";

function formatDate(d, locale) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(locale || undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

export default function ConsentConfirmationModal({
  mode, // "active" | "provisional"
  existingUser, // { firstName, lastName, dateOfBirth }
  originalIssuedAt, // Date (for "provisional" mode only) — when first issued
  reissueCount, // number — how many times the card has been reissued
  onConfirm,
  onCancel,
  submitting = false,
}) {
  const { t, i18n } = useTranslation("clinic");
  const [agreed, setAgreed] = useState(false);

  const fullName =
    [existingUser?.firstName, existingUser?.lastName]
      .filter(Boolean)
      .join(" ") || "—";

  const dobLabel = formatDate(existingUser?.dateOfBirth, i18n.language);

  const isProvisional = mode === "provisional";

  // Title + intro vary by mode.
  const title = isProvisional
    ? t("patients.wizard.consent.provisional.title", {
        defaultValue: "Пациент уже имеет карту в DocPats",
      })
    : t("patients.wizard.consent.active.title", {
        defaultValue: "Пациент уже зарегистрирован в DocPats",
      });

  const intro = isProvisional
    ? t("patients.wizard.consent.provisional.intro", {
        defaultValue:
          "В системе уже есть неактивированная карта для этого пациента. Если вы продолжите, будет выпущена новая карта — старая перестанет работать.",
      })
    : t("patients.wizard.consent.active.intro", {
        defaultValue:
          "У этого пациента уже есть активный аккаунт DocPats с собственным email и паролем. Если вы продолжите, карта пациента будет привязана к вашей клинике — новые данные для входа не выдаются.",
      });

  const confirmLabel = isProvisional
    ? t("patients.wizard.consent.provisional.confirm", {
        defaultValue: "Перевыпустить и привязать",
      })
    : t("patients.wizard.consent.active.confirm", {
        defaultValue: "Привязать к клинике",
      });

  const consentText = t("patients.wizard.consent.checkbox", {
    defaultValue:
      "Я подтверждаю, что пациент дал согласие на привязку к нашей клинике (бумажная или электронная форма подписана).",
  });

  return (
    <div
      className="consent-modal-backdrop"
      onClick={(e) => {
        // Click on backdrop (outside content) cancels — defensive,
        // receptionist may want to bail out without committing.
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div
        className="consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
      >
        <div
          className={`consent-modal-header ${
            isProvisional ? "is-provisional" : "is-active"
          }`}
        >
          <span className="consent-modal-icon">
            {isProvisional ? "🔄" : "🔗"}
          </span>
          <h3 id="consent-modal-title">{title}</h3>
        </div>

        <div className="consent-modal-body">
          <p className="consent-modal-intro">{intro}</p>

          <div className="consent-modal-user-card">
            <div className="consent-modal-user-row">
              <span className="consent-modal-user-label">
                {t("patients.wizard.consent.foundUser", {
                  defaultValue: "Найденный пациент",
                })}
              </span>
              <span className="consent-modal-user-value">{fullName}</span>
            </div>
            {existingUser?.dateOfBirth && (
              <div className="consent-modal-user-row">
                <span className="consent-modal-user-label">
                  {t("patients.fields.dateOfBirth", {
                    defaultValue: "Дата рождения",
                  })}
                </span>
                <span className="consent-modal-user-value">{dobLabel}</span>
              </div>
            )}
            {isProvisional && originalIssuedAt && (
              <div className="consent-modal-user-row">
                <span className="consent-modal-user-label">
                  {t("patients.wizard.consent.cardIssuedAt", {
                    defaultValue: "Карта выдана",
                  })}
                </span>
                <span className="consent-modal-user-value">
                  {formatDate(originalIssuedAt, i18n.language)}
                </span>
              </div>
            )}
            {isProvisional && reissueCount > 0 && (
              <div className="consent-modal-user-row">
                <span className="consent-modal-user-label">
                  {t("patients.wizard.consent.reissueCount", {
                    defaultValue: "Карта перевыпускалась",
                  })}
                </span>
                <span className="consent-modal-user-value consent-modal-warn">
                  {t("patients.wizard.consent.reissueCountValue", {
                    count: reissueCount,
                    defaultValue: "{{count}} раз(а)",
                  })}
                </span>
              </div>
            )}
          </div>

          <label className="consent-modal-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={submitting}
            />
            <span>{consentText}</span>
          </label>
        </div>

        <div className="consent-modal-actions">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            {t("common.cancel", { defaultValue: "Отмена" })}
          </button>
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={onConfirm}
            disabled={!agreed || submitting}
          >
            {submitting
              ? t("common.submitting", { defaultValue: "Отправка..." })
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
