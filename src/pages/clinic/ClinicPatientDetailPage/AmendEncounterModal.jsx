// client/src/pages/clinic/ClinicPatientDetailPage/AmendEncounterModal.jsx
//
// Modal for amending an existing signed/amended encounter.
// Sprint 2 Phase 2D.2 — Step 2.
//
// HIPAA-flavored amend semantics:
//   - Cannot edit fields silently — every change requires a reason
//   - The PREVIOUS values are preserved in encounter.history[] server-side
//   - Status transitions: signed → amended OR amended → amended (re-amend)
//
// Backend endpoint: PATCH /medical/encounters/:id/amend
//   Body: { reason: string (min 5 chars, required), ...changed fields }
//
// Form UX:
//   - Reason field at the top (required, prominent)
//   - Below: same content fields as create/edit, prefilled with current values
//   - "Apply amendment" submits; backend stores old → history[], new → top-level
//
// Note: we don't currently surface mainDiagnosis edits in amend (matches the
// myClinic convention). If user wants to change diagnosis significantly,
// pattern is: delete (owner) + create new. This can be relaxed later if
// real workflow demands amending diagnoses too.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { amendEncounter } from "../../../api/clinic";
// Styles come from medicalRecordsSection.css (imported by the parent).

const MIN_REASON_LENGTH = 5;

export default function AmendEncounterModal({ encounter, onClose, onSaved }) {
  const { t } = useTranslation("clinic");

  const [reason, setReason] = useState("");
  const [form, setForm] = useState({
    additionalDiagnosis: encounter.additionalDiagnosis || "",
    complaints: encounter.complaints || "",
    anamnesisMorbi: encounter.anamnesisMorbi || "",
    statusPreasens: encounter.statusPreasens || "",
    recommendations: encounter.recommendations || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validate() {
    const errs = {};
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      errs.reason = t("medical.encounters.errors.reasonTooShort", {
        min: MIN_REASON_LENGTH,
        defaultValue: `Опишите причину исправления (не менее ${MIN_REASON_LENGTH} символов).`,
      });
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    const payload = {
      reason: reason.trim(),
      additionalDiagnosis: form.additionalDiagnosis.trim(),
      complaints: form.complaints.trim(),
      anamnesisMorbi: form.anamnesisMorbi.trim(),
      statusPreasens: form.statusPreasens.trim(),
      recommendations: form.recommendations.trim(),
    };

    try {
      const res = await amendEncounter(encounter._id, payload);
      const updated = res.encounter || res;
      onSaved && onSaved(updated);
    } catch (err) {
      console.error("Amend failed:", err);
      setErrors({
        _form:
          err.response?.data?.error ||
          t("medical.encounters.errors.amendFailed", {
            defaultValue: "Не удалось применить исправление",
          }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="med-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        className="med-modal med-modal-encounter"
        role="dialog"
        aria-modal="true"
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="med-modal-head">
          <h3>
            {t("medical.encounters.amendTitle", {
              defaultValue: "Исправление записи",
            })}
          </h3>
          <button
            type="button"
            className="med-modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="med-modal-body">
          {/* Reason — prominent, on top */}
          <fieldset className="med-fieldset med-fieldset-reason">
            <legend>
              {t("medical.encounters.reasonLegend", {
                defaultValue: "Причина исправления",
              })}{" "}
              <span className="med-required-mark">*</span>
            </legend>
            <div className="patients-form-field">
              <label>
                {t("medical.encounters.reasonLabel", {
                  defaultValue: "Что и почему меняется",
                })}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.reason;
                      return next;
                    });
                  }
                }}
                placeholder={t("medical.encounters.reasonPlaceholder", {
                  defaultValue:
                    "Например: уточнены рекомендации после получения новых анализов",
                })}
                className={errors.reason ? "has-error" : ""}
                disabled={submitting}
                autoFocus
              />
              {errors.reason && (
                <span className="patients-form-error">{errors.reason}</span>
              )}
              <span className="patients-form-optional">
                {t("medical.encounters.reasonHint", {
                  min: MIN_REASON_LENGTH,
                  defaultValue: `Минимум ${MIN_REASON_LENGTH} символов. Будет сохранено в журнале изменений.`,
                })}
              </span>
            </div>
          </fieldset>

          {/* Editable content fields */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.encounters.amendChangesLegend", {
                defaultValue: "Изменения",
              })}
            </legend>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.additionalDiagnosis", {
                  defaultValue: "Сопутствующий диагноз",
                })}
              </label>
              <input
                type="text"
                value={form.additionalDiagnosis}
                onChange={(e) =>
                  setField("additionalDiagnosis", e.target.value)
                }
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.complaints", {
                  defaultValue: "Жалобы",
                })}
              </label>
              <textarea
                rows={3}
                value={form.complaints}
                onChange={(e) => setField("complaints", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.anamnesisMorbi", {
                  defaultValue: "Anamnesis morbi",
                })}
              </label>
              <textarea
                rows={3}
                value={form.anamnesisMorbi}
                onChange={(e) => setField("anamnesisMorbi", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.statusPreasens", {
                  defaultValue: "Status praesens",
                })}
              </label>
              <textarea
                rows={3}
                value={form.statusPreasens}
                onChange={(e) => setField("statusPreasens", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.recommendations", {
                  defaultValue: "Рекомендации",
                })}
              </label>
              <textarea
                rows={3}
                value={form.recommendations}
                onChange={(e) => setField("recommendations", e.target.value)}
                disabled={submitting}
              />
            </div>
          </fieldset>

          {errors._form && (
            <div className="patients-form-error patients-form-error-banner">
              {errors._form}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="med-modal-foot">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("common.cancel", { defaultValue: "Отмена" })}
          </button>
          <button
            type="submit"
            className="staff-page-btn-primary"
            disabled={submitting}
          >
            {submitting
              ? t("common.submitting", { defaultValue: "Сохранение..." })
              : t("medical.encounters.applyAmendButton", {
                  defaultValue: "Применить исправление",
                })}
          </button>
        </div>
      </form>
    </div>
  );
}
