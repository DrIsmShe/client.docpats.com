// client/src/pages/clinic/ClinicPatientDetailPage/ImagingEditModal.jsx
//
// Modal for editing an imaging study's text fields. Sprint 2 Phase 2D.2 — Step 4.
//
// IMPORTANT: images are IMMUTABLE post-create. Backend's updateImagingStudy
// allows only: report, diagnosis, doctorNotes, contrastUsed, validatedByDoctor,
// sharedWith. To change images, the workflow is delete + re-create.
//
// This modal mirrors the backend's editable field set exactly so the UI
// can't request changes the server will reject.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateImagingStudy } from "../../../api/clinic";
import { studyTypeLabel } from "./ImagingTab";

export default function ImagingEditModal({ record, onClose, onSaved }) {
  const { t } = useTranslation("clinic");

  const [form, setForm] = useState({
    diagnosis: record.diagnosis || "",
    report: record.report || "",
    doctorNotes: record.doctorNotes || "",
    contrastUsed: Boolean(record.contrastUsed),
    validatedByDoctor: Boolean(record.validatedByDoctor),
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        diagnosis: form.diagnosis.trim() || null,
        report: form.report.trim() || null,
        doctorNotes: form.doctorNotes.trim() || null,
        contrastUsed: form.contrastUsed,
        validatedByDoctor: form.validatedByDoctor,
      };
      const res = await updateImagingStudy(record._id, payload);
      const saved = res.imaging || res;
      onSaved && onSaved(saved);
    } catch (err) {
      console.error("Update imaging failed:", err);
      setErrors({
        _form:
          err.response?.data?.error ||
          t("common.saveFailed", { defaultValue: "Не удалось сохранить" }),
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
            {t("medical.imaging.editTitle", {
              type: studyTypeLabel(record.studyType, t),
              defaultValue: "Редактировать исследование",
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
          <p className="med-info-note">
            {t("medical.imaging.editNote", {
              defaultValue:
                "Снимки нельзя изменить после загрузки. Чтобы заменить файлы — удалите исследование и создайте новое.",
            })}
          </p>

          <fieldset className="med-fieldset">
            <legend>
              {t("medical.imaging.reportTitle", {
                defaultValue: "Заключение",
              })}
            </legend>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.diagnosis", {
                  defaultValue: "Диагноз",
                })}
              </label>
              <input
                type="text"
                value={form.diagnosis}
                onChange={(e) => setField("diagnosis", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.report", {
                  defaultValue: "Описание / заключение",
                })}
              </label>
              <textarea
                rows={5}
                value={form.report}
                onChange={(e) => setField("report", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.doctorNotes", {
                  defaultValue: "Заметки врача",
                })}
              </label>
              <textarea
                rows={3}
                value={form.doctorNotes}
                onChange={(e) => setField("doctorNotes", e.target.value)}
                disabled={submitting}
              />
            </div>
          </fieldset>

          <fieldset className="med-fieldset">
            <legend>
              {t("medical.imaging.flagsTitle", {
                defaultValue: "Параметры",
              })}
            </legend>

            <div className="patients-form-field">
              <label className="med-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.contrastUsed}
                  onChange={(e) => setField("contrastUsed", e.target.checked)}
                  disabled={submitting}
                />
                {t("medical.imaging.fields.contrastUsed", {
                  defaultValue: "С контрастом",
                })}
              </label>
            </div>

            <div className="patients-form-field">
              <label className="med-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.validatedByDoctor}
                  onChange={(e) =>
                    setField("validatedByDoctor", e.target.checked)
                  }
                  disabled={submitting}
                />
                {t("medical.imaging.fields.validatedByDoctor", {
                  defaultValue: "Подтверждено врачом",
                })}
              </label>
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
              : t("common.save", { defaultValue: "Сохранить" })}
          </button>
        </div>
      </form>
    </div>
  );
}
