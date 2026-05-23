// client/src/pages/clinic/ClinicPatientsPage/DuplicatePatientModal.jsx
//
// Modal shown when registration finds a duplicate WITHIN the same clinic:
//
//   - patient_duplicate_in_clinic:  same phone/email already used by
//                                   another ClinicPatient in this clinic
//   - already_linked_here:          patientConsentConfirmed was true,
//                                   but ClinicPatient already linked to
//                                   this User in this clinic
//
// Both are dead-end conflicts — there is no "go ahead anyway" path.
// The receptionist either opens the existing patient detail page or
// cancels and edits their input (typo in email, etc.).

import React from "react";
import { useTranslation } from "react-i18next";
import "./consentConfirmationModal.css"; // share styles with consent modal

export default function DuplicatePatientModal({
  reason, // "duplicate_in_clinic" | "already_linked_here"
  matchedField, // "phone" | "email" — only for duplicate_in_clinic
  existingPatientId, // ObjectId string
  onOpenExisting, // () => navigate to /clinic/patients/{id}
  onCancel,
}) {
  const { t } = useTranslation("clinic");

  const isLinked = reason === "already_linked_here";

  const title = isLinked
    ? t("patients.wizard.duplicate.linked.title", {
        defaultValue: "Пациент уже привязан к клинике",
      })
    : t("patients.wizard.duplicate.inClinic.title", {
        defaultValue: "Пациент уже есть в клинике",
      });

  const body = isLinked
    ? t("patients.wizard.duplicate.linked.body", {
        defaultValue:
          "Этот аккаунт DocPats уже привязан к карте пациента в вашей клинике. Откройте существующую карту, чтобы продолжить работу.",
      })
    : matchedField === "email"
      ? t("patients.wizard.duplicate.inClinic.byEmail", {
          defaultValue:
            "В вашей клинике уже есть пациент с таким email. Откройте существующую карту, либо проверьте email на ошибку.",
        })
      : t("patients.wizard.duplicate.inClinic.byPhone", {
          defaultValue:
            "В вашей клинике уже есть пациент с таким телефоном. Откройте существующую карту, либо проверьте телефон на ошибку.",
        });

  return (
    <div
      className="consent-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-modal-title"
      >
        <div className="consent-modal-header is-warning">
          <span className="consent-modal-icon">⚠️</span>
          <h3 id="dup-modal-title">{title}</h3>
        </div>

        <div className="consent-modal-body">
          <p className="consent-modal-intro">{body}</p>
        </div>

        <div className="consent-modal-actions">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onCancel}
          >
            {t("common.cancel", { defaultValue: "Отмена" })}
          </button>
          {existingPatientId && (
            <button
              type="button"
              className="staff-page-btn-primary"
              onClick={onOpenExisting}
            >
              {t("patients.wizard.duplicate.openExisting", {
                defaultValue: "Открыть карту пациента",
              })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
