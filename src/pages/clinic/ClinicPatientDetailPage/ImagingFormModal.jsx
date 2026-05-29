// client/src/pages/clinic/ClinicPatientDetailPage/ImagingFormModal.jsx
//
// Modal for creating a new imaging study. Sprint 2 Phase 2D.2 — Step 4.
//
// Flow:
//   1. User selects studyType from <select>
//   2. User picks files via <input type="file" multiple> (or hits cancel)
//   3. Local preview shows thumbnails of selected files
//   4. User fills text fields (date, report, diagnosis, contrastUsed)
//   5. Submit → createImagingStudy with FormData (multipart)
//      → backend uploads each file to R2 via processFiles middleware
//      → returns { imaging: { images: [...r2 URLs] } }
//
// File handling:
//   - File objects kept in state as { file, previewUrl } pairs
//   - previewUrl from URL.createObjectURL — must revoke on cleanup
//   - Max 20 files (matches backend multer.array("images", 20))
//   - No explicit MIME filter on the picker (accept="image/*,application/pdf")
//     The backend already enforces the full allowed-types regex
//
// Upload state:
//   - Single "submitting" spinner on the upload button
//   - Future: hook axios onUploadProgress for real progress bar

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createImagingStudy } from "../../../api/clinic";

const STUDY_TYPES = [
  "CT",
  "MRI",
  "USG",
  "X-Ray",
  "PET",
  "SPECT",
  "EEG",
  "ECG",
  "Holter",
  "Spirometry",
  "Doppler",
  "Gastroscopy",
  "Colonoscopy",
  "CapsuleEndoscopy",
];

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 150;

export default function ImagingFormModal({ patient, onClose, onSaved }) {
  const { t } = useTranslation("clinic");

  const fileInputRef = useRef(null);

  const [studyType, setStudyType] = useState("CT");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [report, setReport] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [contrastUsed, setContrastUsed] = useState(false);

  // Each item: { file, previewUrl, isImage }
  const [filePackets, setFilePackets] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Cleanup blob URLs on unmount / when files removed
  useEffect(() => {
    return () => {
      filePackets.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilePick(e) {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    // Validate count
    if (filePackets.length + picked.length > MAX_FILES) {
      setErrors((prev) => ({
        ...prev,
        files: t("medical.imaging.errors.tooManyFiles", {
          max: MAX_FILES,
          defaultValue: `Можно прикрепить максимум ${MAX_FILES} файлов.`,
        }),
      }));
      // Reset the input so user can re-pick after removing some
      e.target.value = "";
      return;
    }

    // Validate per-file size
    const oversize = picked.find(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (oversize) {
      setErrors((prev) => ({
        ...prev,
        files: t("medical.imaging.errors.fileTooLarge", {
          name: oversize.name,
          max: MAX_FILE_SIZE_MB,
          defaultValue: `Файл «${oversize.name}» больше ${MAX_FILE_SIZE_MB} МБ.`,
        }),
      }));
      e.target.value = "";
      return;
    }

    setErrors((prev) => {
      const { files: _files, ...rest } = prev;
      return rest;
    });

    const newPackets = picked.map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
        isImage,
      };
    });
    setFilePackets((prev) => [...prev, ...newPackets]);
    e.target.value = ""; // allow re-picking the same file later
  }

  function removeFile(index) {
    setFilePackets((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  function validate() {
    const errs = {};
    if (!STUDY_TYPES.includes(studyType)) {
      errs.studyType = t("medical.imaging.errors.studyTypeRequired", {
        defaultValue: "Выберите тип исследования",
      });
    }
    // No required files — record can be created without images
    // (matches backend, which has images[] optional).
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
    try {
      const body = {
        studyType,
        date: date || undefined,
        report: report.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        contrastUsed,
      };
      const files = filePackets.map((p) => p.file);

      const res = await createImagingStudy(patient._id, { body, files });
      const saved = res.imaging || res;
      onSaved && onSaved(saved);
    } catch (err) {
      console.error("Upload imaging failed:", err);
      setErrors({
        _form:
          err.response?.data?.error ||
          t("medical.imaging.errors.uploadFailed", {
            defaultValue: "Не удалось загрузить исследование",
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
            {t("medical.imaging.createTitle", {
              defaultValue: "Новое исследование",
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
          {/* Type + date */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.imaging.studyInfoTitle", {
                defaultValue: "Исследование",
              })}
            </legend>

            <div className="patients-form-row">
              <div className="patients-form-field" style={{ flex: 1 }}>
                <label>
                  {t("medical.imaging.fields.studyType", {
                    defaultValue: "Тип исследования",
                  })}
                </label>
                <select
                  value={studyType}
                  onChange={(e) => setStudyType(e.target.value)}
                  disabled={submitting}
                  className={errors.studyType ? "has-error" : ""}
                >
                  {STUDY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.studyType && (
                  <span className="patients-form-error">
                    {errors.studyType}
                  </span>
                )}
              </div>

              <div className="patients-form-field" style={{ flex: 1 }}>
                <label>
                  {t("medical.imaging.fields.date", {
                    defaultValue: "Дата исследования",
                  })}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="patients-form-field">
              <label className="med-checkbox-label">
                <input
                  type="checkbox"
                  checked={contrastUsed}
                  onChange={(e) => setContrastUsed(e.target.checked)}
                  disabled={submitting}
                />
                {t("medical.imaging.fields.contrastUsed", {
                  defaultValue: "С контрастом",
                })}
              </label>
            </div>
          </fieldset>

          {/* Files */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.imaging.filesTitle", {
                defaultValue: "Снимки и файлы",
              })}
              {filePackets.length > 0 && (
                <span className="staff-page-count">{filePackets.length}</span>
              )}
            </legend>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,video/*,application/dicom"
              onChange={handleFilePick}
              disabled={submitting}
              style={{ display: "none" }}
            />

            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || filePackets.length >= MAX_FILES}
            >
              {t("medical.imaging.pickFilesButton", {
                defaultValue: "Выбрать файлы…",
              })}
            </button>

            {errors.files && (
              <div className="patients-form-error patients-form-error-banner">
                {errors.files}
              </div>
            )}

            {filePackets.length > 0 && (
              <div className="med-file-preview-grid">
                {filePackets.map((packet, i) => (
                  <FilePreview
                    key={i}
                    packet={packet}
                    onRemove={() => removeFile(i)}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}
          </fieldset>

          {/* Report + diagnosis */}
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
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.report", {
                  defaultValue: "Описание / заключение",
                })}
                <span className="patients-form-optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <textarea
                rows={5}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                disabled={submitting}
                placeholder={t("medical.imaging.placeholders.report", {
                  defaultValue:
                    "Описание снимков, выявленные изменения, рекомендации…",
                })}
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
              ? t("medical.imaging.uploading", {
                  defaultValue: "Загрузка…",
                })
              : t("medical.imaging.uploadButton", {
                  defaultValue: "Загрузить",
                })}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── File preview chip ───

function FilePreview({ packet, onRemove, disabled }) {
  const { file, previewUrl, isImage } = packet;
  return (
    <div className="med-file-preview">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt="" />
      ) : (
        <div className="med-file-preview-icon">📄</div>
      )}
      <div className="med-file-preview-name" title={file.name}>
        {file.name}
      </div>
      <button
        type="button"
        className="med-file-preview-remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  );
}
