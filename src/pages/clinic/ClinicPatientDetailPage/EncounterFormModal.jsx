// client/src/pages/clinic/ClinicPatientDetailPage/EncounterFormModal.jsx
//
// Modal for creating OR editing an encounter (medical history record).
// Sprint 2 Phase 2D.2 — Step 2 (now supports edit-draft).
//
// Modes:
//   - "create"      → POST createEncounter
//                     "Сохранить как черновик" → status=draft
//                     "Подписать и сохранить"  → status=signed
//   - "edit-draft"  → PATCH updateEncounter (works only for draft;
//                     backend rejects signed/amended via 422)
//                     Same two buttons:
//                       "Сохранить" → keeps status=draft
//                       "Подписать и сохранить" → triggers a separate
//                         signEncounter call after update (Step 2 picks
//                         the "update then sign" two-step pattern to
//                         keep the controller endpoint shape simple).
//
// Backend rules recap:
//   - status=signed requires mainDiagnosis (code + text)
//   - status=draft  has no required fields
//   - update only works on drafts; for signed/amended use Amend modal
//
// ICD-10 autocomplete: still deferred — plain text inputs for now.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createEncounter,
  updateEncounter,
  signEncounter,
} from "../../../api/clinic";
// Styles come from medicalRecordsSection.css (imported by the parent
// MedicalRecordsSection). We share the .med-modal-* / .med-fieldset
// classes — no separate CSS file needed.

const EMPTY_FORM = {
  mainDiagnosisCode: "",
  mainDiagnosisCodeTitle: "",
  mainDiagnosisText: "",
  additionalDiagnosis: "",
  complaints: "",
  anamnesisMorbi: "",
  statusPreasens: "",
  recommendations: "",
};

/**
 * Seed form values from an existing encounter (for edit-draft mode).
 */
function seedFromEncounter(enc) {
  if (!enc) return EMPTY_FORM;
  return {
    mainDiagnosisCode: enc.mainDiagnosis?.code || "",
    mainDiagnosisCodeTitle: enc.mainDiagnosis?.codeTitle || "",
    mainDiagnosisText: enc.mainDiagnosis?.text || "",
    additionalDiagnosis: enc.additionalDiagnosis || "",
    complaints: enc.complaints || "",
    anamnesisMorbi: enc.anamnesisMorbi || "",
    statusPreasens: enc.statusPreasens || "",
    recommendations: enc.recommendations || "",
  };
}

export default function EncounterFormModal({
  patient,
  mode = "create",
  encounter = null,
  onClose,
  onSaved,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = mode === "edit-draft";

  const [form, setForm] = useState(
    isEdit ? seedFromEncounter(encounter) : EMPTY_FORM,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null); // "save" | "sign"
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

  /**
   * Validate. `action` is "sign" (need mainDiagnosis) or "save" (no required fields).
   */
  function validate(action) {
    const errs = {};
    if (action === "sign") {
      if (!form.mainDiagnosisCode.trim()) {
        errs.mainDiagnosisCode = t("medical.encounters.errors.codeRequired", {
          defaultValue: "Укажите код МКБ-10",
        });
      }
      if (!form.mainDiagnosisText.trim()) {
        errs.mainDiagnosisText = t("medical.encounters.errors.dxTextRequired", {
          defaultValue: "Укажите текст диагноза",
        });
      }
    }
    return errs;
  }

  /**
   * Build the body the backend expects. Only includes fields that have a
   * value — let backend defaults handle the rest. mainDiagnosis is only
   * included if at least code OR text was entered.
   *
   * @param {string} status  "draft" | "signed" — included only for CREATE
   */
  function buildPayload({ includeStatus, status } = {}) {
    const payload = {};
    if (includeStatus) payload.status = status;

    const hasDx =
      form.mainDiagnosisCode.trim() || form.mainDiagnosisText.trim();
    if (hasDx) {
      payload.mainDiagnosis = {
        code: form.mainDiagnosisCode.trim(),
        codeTitle: form.mainDiagnosisCodeTitle.trim(),
        text: form.mainDiagnosisText.trim(),
      };
    }

    // Body fields — always send (allow clearing to empty string).
    payload.additionalDiagnosis = form.additionalDiagnosis.trim();
    payload.complaints = form.complaints.trim();
    payload.anamnesisMorbi = form.anamnesisMorbi.trim();
    payload.statusPreasens = form.statusPreasens.trim();
    payload.recommendations = form.recommendations.trim();

    return payload;
  }

  /**
   * Unified submit dispatcher. action: "save" | "sign"
   *
   * Create mode:
   *   - save → POST status=draft
   *   - sign → POST status=signed
   *
   * Edit-draft mode:
   *   - save → PATCH (status stays draft)
   *   - sign → PATCH then signEncounter (two-step on client; cleaner
   *            than overloading the update endpoint with a "sign now"
   *            flag on backend)
   */
  async function handleSubmit(action) {
    const errs = validate(action);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmittingAction(action);

    try {
      let saved;
      if (isEdit) {
        // PATCH the draft with current form state
        const patchPayload = buildPayload({ includeStatus: false });
        const patched = await updateEncounter(encounter._id, patchPayload);
        saved = patched.encounter || patched;

        // If user pressed "Подписать и сохранить" — chain a sign call.
        if (action === "sign") {
          const signed = await signEncounter(encounter._id, {});
          saved = signed.encounter || signed;
        }
      } else {
        // CREATE
        const payload = buildPayload({
          includeStatus: true,
          status: action === "sign" ? "signed" : "draft",
        });
        const created = await createEncounter(patient._id, payload);
        saved = created.encounter || created;
      }

      onSaved && onSaved(saved);
    } catch (err) {
      console.error("Failed to save encounter:", err);
      handleApiError(err);
    } finally {
      setSubmitting(false);
      setSubmittingAction(null);
    }
  }

  function handleApiError(err) {
    const status = err.response?.status;
    const details = err.response?.data?.details;

    if (status === 422 && details?.fieldErrors) {
      const fieldErrors = {};
      if (details.fieldErrors.mainDiagnosis) {
        fieldErrors.mainDiagnosisCode = String(
          details.fieldErrors.mainDiagnosis[0] || "",
        );
      }
      setErrors({
        ...fieldErrors,
        _form:
          err.response?.data?.error ||
          t("common.saveFailed", { defaultValue: "Не удалось сохранить" }),
      });
      return;
    }

    if (status === 422 || status === 409) {
      // E.g. trying to update a non-draft. Show backend message verbatim.
      setErrors({
        _form:
          err.response?.data?.error ||
          t("medical.encounters.errors.cannotEditNonDraft", {
            defaultValue:
              "Эту запись больше нельзя редактировать как черновик — используйте «Исправить».",
          }),
      });
      return;
    }

    setErrors({
      _form:
        err.response?.data?.error ||
        t("common.saveFailed", { defaultValue: "Не удалось сохранить" }),
    });
  }

  const title = isEdit
    ? t("medical.encounters.editDraftTitle", {
        defaultValue: "Редактировать черновик",
      })
    : t("medical.encounters.createTitle", {
        defaultValue: "Новая запись приёма",
      });

  const saveLabel = isEdit
    ? t("common.save", { defaultValue: "Сохранить" })
    : t("medical.encounters.saveDraftButton", {
        defaultValue: "Сохранить как черновик",
      });

  return (
    <div
      className="med-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="med-modal med-modal-encounter"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="med-modal-head">
          <h3>{title}</h3>
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
          {/* Main diagnosis */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.encounters.mainDiagnosisTitle", {
                defaultValue: "Основной диагноз",
              })}
            </legend>

            <div className="patients-form-row">
              <div
                className="patients-form-field"
                style={{ flex: "0 0 180px" }}
              >
                <label>
                  {t("medical.encounters.fields.icdCode", {
                    defaultValue: "Код МКБ-10",
                  })}
                </label>
                <input
                  type="text"
                  value={form.mainDiagnosisCode}
                  onChange={(e) =>
                    setField("mainDiagnosisCode", e.target.value)
                  }
                  placeholder="J45.1"
                  className={errors.mainDiagnosisCode ? "has-error" : ""}
                  disabled={submitting}
                />
                {errors.mainDiagnosisCode && (
                  <span className="patients-form-error">
                    {errors.mainDiagnosisCode}
                  </span>
                )}
              </div>
              <div className="patients-form-field" style={{ flex: 1 }}>
                <label>
                  {t("medical.encounters.fields.icdTitle", {
                    defaultValue: "Название по МКБ",
                  })}
                  <span className="patients-form-optional">
                    {t("common.optional", { defaultValue: "необязательно" })}
                  </span>
                </label>
                <input
                  type="text"
                  value={form.mainDiagnosisCodeTitle}
                  onChange={(e) =>
                    setField("mainDiagnosisCodeTitle", e.target.value)
                  }
                  placeholder={t("medical.encounters.placeholders.icdTitle", {
                    defaultValue: "Mild persistent asthma",
                  })}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.diagnosisText", {
                  defaultValue: "Диагноз (текст)",
                })}
              </label>
              <input
                type="text"
                value={form.mainDiagnosisText}
                onChange={(e) => setField("mainDiagnosisText", e.target.value)}
                placeholder={t(
                  "medical.encounters.placeholders.diagnosisText",
                  {
                    defaultValue:
                      "Бронхиальная астма, лёгкое персистирующее течение",
                  },
                )}
                className={errors.mainDiagnosisText ? "has-error" : ""}
                disabled={submitting}
              />
              {errors.mainDiagnosisText && (
                <span className="patients-form-error">
                  {errors.mainDiagnosisText}
                </span>
              )}
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.additionalDiagnosis", {
                  defaultValue: "Сопутствующий диагноз",
                })}
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
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
          </fieldset>

          {/* Clinical content */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.encounters.clinicalContentTitle", {
                defaultValue: "Клиническая информация",
              })}
            </legend>

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
            type="button"
            className="staff-page-btn-secondary"
            onClick={() => handleSubmit("save")}
            disabled={submitting}
          >
            {submitting && submittingAction === "save"
              ? t("common.submitting", { defaultValue: "Сохранение..." })
              : saveLabel}
          </button>
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={() => handleSubmit("sign")}
            disabled={submitting}
          >
            {submitting && submittingAction === "sign"
              ? t("common.submitting", { defaultValue: "Сохранение..." })
              : t("medical.encounters.saveSignedButton", {
                  defaultValue: "Подписать и сохранить",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
