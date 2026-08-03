// client/src/pages/clinic/ClinicPatientDetailPage/EncounterFormModal.jsx
//
// Modal for creating OR editing an encounter (medical history record).
// Sprint 2 Phase 2D.2 — Step 2 (now supports edit-draft).
//
// FIELD PARITY (3 Jun 2026): added the 6 clinical fields that
// EncounterDetailModal + patient-side detail already display but the form
// couldn't capture: anamnesisVitae, statusLocalis, and the four study
// results (ctScanResults / mriResults / ultrasoundResults /
// laboratoryTestResults). The encounter model already had these fields —
// only the input form was missing them, so they showed empty everywhere.
//
// Modes:
//   - "create"      → POST createEncounter
//   - "edit-draft"  → PATCH updateEncounter (drafts only)
//
// Backend rules recap:
//   - status=signed requires mainDiagnosis (code + text)
//   - status=draft  has no required fields
//   - update only works on drafts; for signed/amended use Amend modal

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createEncounter,
  updateEncounter,
  signEncounter,
} from "../../../api/clinic";
import ICD10Autocomplete from "../../../components/ICD10Autocomplete";
import { listExaminationTemplates } from "../../../api/examinationTemplates";
import { ENCOUNTER_BLOCKS, encounterBlockLabel } from "../examinationModalities";
import ExaminationTemplatePicker from "./ExaminationTemplatePicker";

const EMPTY_FORM = {
  mainDiagnosisCode: "",
  mainDiagnosisCodeTitle: "",
  mainDiagnosisText: "",
  additionalDiagnosis: "",
  complaints: "",
  anamnesisMorbi: "",
  anamnesisVitae: "",
  statusPreasens: "",
  statusLocalis: "",
  recommendations: "",
  ctScanResults: "",
  mriResults: "",
  ultrasoundResults: "",
  laboratoryTestResults: "",
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
    anamnesisVitae: enc.anamnesisVitae || "",
    statusPreasens: enc.statusPreasens || "",
    statusLocalis: enc.statusLocalis || "",
    recommendations: enc.recommendations || "",
    ctScanResults: enc.ctScanResults || "",
    mriResults: enc.mriResults || "",
    ultrasoundResults: enc.ultrasoundResults || "",
    laboratoryTestResults: enc.laboratoryTestResults || "",
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

  // Заготовки формулировок для блоков приёма: { complaints: [], … }.
  const [templates, setTemplates] = useState({});
  // Для какого блока сейчас открыто окно выбора (null — закрыто).
  const [pickerKind, setPickerKind] = useState(null);

  // Справочник грузится один раз при открытии формы: он не зависит ни от
  // пациента, ни от заполняемых полей — это набор формулировок клиники.
  //
  // Ошибку глушим намеренно: справочник может быть пуст или недоступен по
  // правам, и это не повод ломать форму приёма — текст всегда можно набрать
  // руками, ровно как и раньше.
  useEffect(() => {
    let alive = true;

    (async () => {
      const lists = await Promise.all(
        ENCOUNTER_BLOCKS.map((b) =>
          listExaminationTemplates({ scope: "encounter", kind: b.key }).catch(
            () => [],
          ),
        ),
      );
      if (!alive) return;
      const next = {};
      ENCOUNTER_BLOCKS.forEach((b, i) => {
        next[b.key] = lists[i];
      });
      setTemplates(next);
    })();

    return () => {
      alive = false;
    };
  }, []);

  function applyTemplate(tpl) {
    if (pickerKind) {
      // Как в единоличной практике: заготовка ЗАМЕЩАЕТ содержимое поля.
      // Это стартовый текст, который врач затем правит, а не вставка к
      // уже написанному.
      setField(pickerKind, tpl.body?.trim() ? tpl.body : tpl.title || "");
    }
    setPickerKind(null);
  }

  /**
   * Кнопка «Шаблоны» в подписи поля. Прячется, когда для блока заготовок
   * нет: кнопка, открывающая пустой список, только мешает.
   */
  function TemplateButton({ kind }) {
    const items = templates[kind] || [];
    if (items.length === 0) return null;
    return (
      <button
        type="button"
        className="exam-template-btn"
        onClick={() => setPickerKind(kind)}
        disabled={submitting}
      >
        {t("medical.encounters.templates.pick", { defaultValue: "Шаблоны" })}
        <span className="exam-template-count">{items.length}</span>
      </button>
    );
  }

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

  function handleICD10Select(selected) {
    if (!selected) {
      setForm((prev) => ({
        ...prev,
        mainDiagnosisCode: "",
        mainDiagnosisCodeTitle: "",
        mainDiagnosisText: "",
      }));
      if (errors.mainDiagnosisCode || errors.mainDiagnosisText) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.mainDiagnosisCode;
          delete next.mainDiagnosisText;
          return next;
        });
      }
      return;
    }
    setForm((prev) => ({
      ...prev,
      mainDiagnosisCode: selected.code,
      mainDiagnosisCodeTitle: selected.title,
      mainDiagnosisText: prev.mainDiagnosisText || selected.title,
    }));
    if (errors.mainDiagnosisCode) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.mainDiagnosisCode;
        return next;
      });
    }
  }

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
    payload.anamnesisVitae = form.anamnesisVitae.trim();
    payload.statusPreasens = form.statusPreasens.trim();
    payload.statusLocalis = form.statusLocalis.trim();
    payload.recommendations = form.recommendations.trim();
    payload.ctScanResults = form.ctScanResults.trim();
    payload.mriResults = form.mriResults.trim();
    payload.ultrasoundResults = form.ultrasoundResults.trim();
    payload.laboratoryTestResults = form.laboratoryTestResults.trim();

    return payload;
  }

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
        const patchPayload = buildPayload({ includeStatus: false });
        const patched = await updateEncounter(encounter._id, patchPayload);
        saved = patched.encounter || patched;

        if (action === "sign") {
          const signed = await signEncounter(encounter._id, {});
          saved = signed.encounter || signed;
        }
      } else {
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
          {/* Main diagnosis — ICD-10 autocomplete (NLM API) */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.encounters.mainDiagnosisTitle", {
                defaultValue: "Основной диагноз (МКБ-10)",
              })}
            </legend>

            <div className="patients-form-field">
              <ICD10Autocomplete
                value={
                  form.mainDiagnosisCode
                    ? {
                        code: form.mainDiagnosisCode,
                        title: form.mainDiagnosisCodeTitle,
                      }
                    : null
                }
                onChange={handleICD10Select}
                placeholder={t("medical.encounters.placeholders.icdSearch", {
                  defaultValue:
                    "Поиск МКБ-10 по коду (J45) или англ. названию (asthma)...",
                })}
              />
              {errors.mainDiagnosisCode && (
                <span className="patients-form-error">
                  {errors.mainDiagnosisCode}
                </span>
              )}
            </div>

            {form.mainDiagnosisCode && (
              <div className="patients-form-field" style={{ marginTop: 12 }}>
                <label>
                  {t("medical.encounters.fields.diagnosisText", {
                    defaultValue: "Диагноз (текст на родном языке)",
                  })}
                </label>
                <textarea
                  rows={3}
                  value={form.mainDiagnosisText}
                  onChange={(e) =>
                    setField("mainDiagnosisText", e.target.value)
                  }
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
                <div
                  style={{
                    fontSize: 11,
                    color: "#7089a6",
                    marginTop: 5,
                  }}
                >
                  💡{" "}
                  {t("medical.encounters.hints.diagnosisText", {
                    defaultValue:
                      "Автозаполнено из МКБ-10. Переведите или перефразируйте на своём языке.",
                  })}
                </div>
                {errors.mainDiagnosisText && (
                  <span className="patients-form-error">
                    {errors.mainDiagnosisText}
                  </span>
                )}
              </div>
            )}

            <div className="patients-form-field" style={{ marginTop: 12 }}>
              <label>
                {t("medical.encounters.fields.additionalDiagnosis", {
                  defaultValue: "Сопутствующий диагноз",
                })}
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
                <TemplateButton kind="additionalDiagnosis" />
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
              <TemplateButton kind="complaints" />
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
              <TemplateButton kind="anamnesisMorbi" />
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
                {t("medical.encounters.fields.anamnesisVitae", {
                  defaultValue: "Anamnesis vitae",
                })}
              <TemplateButton kind="anamnesisVitae" />
              </label>
              <textarea
                rows={3}
                value={form.anamnesisVitae}
                onChange={(e) => setField("anamnesisVitae", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.statusPreasens", {
                  defaultValue: "Status praesens",
                })}
              <TemplateButton kind="statusPreasens" />
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
                {t("medical.encounters.fields.statusLocalis", {
                  defaultValue: "Status localis",
                })}
              <TemplateButton kind="statusLocalis" />
              </label>
              <textarea
                rows={3}
                value={form.statusLocalis}
                onChange={(e) => setField("statusLocalis", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.recommendations", {
                  defaultValue: "Рекомендации",
                })}
              <TemplateButton kind="recommendations" />
              </label>
              <textarea
                rows={3}
                value={form.recommendations}
                onChange={(e) => setField("recommendations", e.target.value)}
                disabled={submitting}
              />
            </div>
          </fieldset>

          {/* Study / examination results */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.encounters.studyResultsTitle", {
                defaultValue: "Результаты исследований",
              })}
              <span className="patients-form-optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </legend>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.ctScanResults", {
                  defaultValue: "Результаты КТ",
                })}
              <TemplateButton kind="ctScanResults" />
              </label>
              <textarea
                rows={2}
                value={form.ctScanResults}
                onChange={(e) => setField("ctScanResults", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.mriResults", {
                  defaultValue: "Результаты МРТ",
                })}
              <TemplateButton kind="mriResults" />
              </label>
              <textarea
                rows={2}
                value={form.mriResults}
                onChange={(e) => setField("mriResults", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.ultrasoundResults", {
                  defaultValue: "Результаты УЗИ",
                })}
              <TemplateButton kind="ultrasoundResults" />
              </label>
              <textarea
                rows={2}
                value={form.ultrasoundResults}
                onChange={(e) => setField("ultrasoundResults", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.encounters.fields.laboratoryTestResults", {
                  defaultValue: "Лабораторные данные",
                })}
              <TemplateButton kind="laboratoryTestResults" />
              </label>
              <textarea
                rows={2}
                value={form.laboratoryTestResults}
                onChange={(e) =>
                  setField("laboratoryTestResults", e.target.value)
                }
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

        {/* Окно выбора заготовки — одно на все блоки приёма; какой именно
            блок заполняем, помнит pickerKind. */}
        <ExaminationTemplatePicker
          open={Boolean(pickerKind)}
          kindLabel={encounterBlockLabel(pickerKind)}
          items={templates[pickerKind] || []}
          onPick={applyTemplate}
          onClose={() => setPickerKind(null)}
        />

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
