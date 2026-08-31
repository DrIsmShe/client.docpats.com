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
import { listExaminationTemplates } from "../../../api/examinationTemplates";
import {
  MODALITIES,
  TEMPLATE_KINDS,
  modalityLabelKey,
  hasRadiation,
} from "../examinationModalities";
import ExaminationTemplatePicker from "./ExaminationTemplatePicker";

// Виды исследований берутся из общего справочника: раньше список был
// прописан здесь копией, и при добавлении новых видов на сервере форма о них
// не узнавала.
const STUDY_TYPES = MODALITIES.map((m) => m.key);

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

  // Блоки протокола, которых раньше в клинике не было: название исследования,
  // рекомендации и доза облучения. Порядок полей в форме — как в единоличной
  // практике: название → протокол → заключение → рекомендации.
  const [nameOfExam, setNameOfExam] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [radiationDose, setRadiationDose] = useState("");

  // Заготовки для всех четырёх блоков сразу: { nameOfExam: [], report: [], … }.
  const [templates, setTemplates] = useState({});
  // Какой из блоков сейчас выбирает заготовку (null — окно закрыто).
  const [pickerKind, setPickerKind] = useState(null);

  // Each item: { file, previewUrl, isImage }
  const [filePackets, setFilePackets] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Заготовки протокола для выбранного вида исследования.
  //
  // Перезапрашиваются при смене вида: у КТ и МРТ наборы формулировок разные.
  // Ошибку глушим намеренно — справочник может быть пуст или недоступен по
  // правам (медсестра его только читает), и это не повод ломать всю форму:
  // текст всегда можно набрать руками.
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const lists = await Promise.all(
          TEMPLATE_KINDS.map((k) =>
            // Область указываем явно, хотя сервер и подставил бы её сам:
            // молчаливый умолчательный режим — ровно то, на чём форма приёма
            // получала чужой список и отказ при сохранении.
            listExaminationTemplates({
              scope: "examination",
              modality: studyType,
              kind: k.key,
            }).catch(() => []),
          ),
        );
        if (!alive) return;
        const next = {};
        TEMPLATE_KINDS.forEach((k, i) => {
          next[k.key] = lists[i];
        });
        setTemplates(next);
      } catch {
        if (alive) setTemplates({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [studyType]);

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

  // Куда подставлять выбранную заготовку. Ключ блока → его setter.
  const SETTERS = {
    nameOfExam: setNameOfExam,
    report: setReport,
    diagnosis: setDiagnosis,
    recommendation: setRecommendation,
  };

  function applyTemplate(tpl) {
    const setter = SETTERS[pickerKind];
    if (setter) {
      // Заголовок используем, только если текста нет: у заготовок вида
      // «название исследования» весь смысл в заголовке, а у протокола —
      // в теле.
      setter(tpl.body?.trim() ? tpl.body : tpl.title || "");
    }
    setPickerKind(null);
  }

  /**
   * Кнопка «Шаблоны» рядом с подписью поля — как в единоличной практике.
   * Прячется, если для этого блока и вида исследования заготовок нет:
   * кнопка, открывающая пустой список, только мешает.
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
        {t("medical.imaging.templates.pick", { defaultValue: "Шаблоны" })}
        <span className="exam-template-count">{items.length}</span>
      </button>
    );
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
        nameOfExam: nameOfExam.trim() || undefined,
        report: report.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
        // Дозу отправляем только у лучевых методов. Сервер всё равно отбросит
        // её у остальных, но слать заведомо лишнее незачем.
        radiationDose: hasRadiation(studyType)
          ? radiationDose.trim() || undefined
          : undefined,
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
                      {t(modalityLabelKey(type), { defaultValue: type })}
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

            <div className="patients-form-row">
              <div className="patients-form-field" style={{ flex: 1 }}>
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

              {/* Доза облучения — только у лучевых методов. У ЭКГ или
                  спирометрии поле просто не показывается. */}
              {hasRadiation(studyType) && (
                <div className="patients-form-field" style={{ flex: 1 }}>
                  <label>
                    {t("medical.imaging.fields.radiationDose", {
                      defaultValue: "Доза облучения",
                    })}
                    <span className="patients-form-optional">
                      {t("common.optional", { defaultValue: "необязательно" })}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={radiationDose}
                    onChange={(e) => setRadiationDose(e.target.value)}
                    disabled={submitting}
                    placeholder="мЗв"
                  />
                </div>
              )}
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

          {/* Протокол исследования: четыре блока в том же порядке, что и в
              единоличной практике — название, протокол, заключение,
              рекомендации. У каждого блока своя кнопка выбора заготовки. */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.imaging.reportTitle", {
                defaultValue: "Протокол исследования",
              })}
            </legend>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.nameOfExam", {
                  defaultValue: "Название исследования",
                })}
                <TemplateButton kind="nameOfExam" />
              </label>
              <input
                type="text"
                value={nameOfExam}
                onChange={(e) => setNameOfExam(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.report", {
                  defaultValue: "Протокол",
                })}
                <TemplateButton kind="report" />
              </label>
              <textarea
                rows={5}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                disabled={submitting}
                placeholder={t("medical.imaging.placeholders.report", {
                  defaultValue: "Описание снимков и выявленных изменений…",
                })}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.diagnosis", {
                  defaultValue: "Заключение",
                })}
                <TemplateButton kind="diagnosis" />
              </label>
              <textarea
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("medical.imaging.fields.recommendation", {
                  defaultValue: "Рекомендации",
                })}
                <TemplateButton kind="recommendation" />
              </label>
              <textarea
                rows={3}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
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

        {/* Окно выбора заготовки. Одно на все четыре блока: какой именно
            блок заполняем, помнит pickerKind. */}
        <ExaminationTemplatePicker
          open={Boolean(pickerKind)}
          kindLabel={
            (() => {
              const kk = TEMPLATE_KINDS.find((k) => k.key === pickerKind)?.labelKey;
              return kk ? t(kk) : "";
            })()
          }
          modality={studyType}
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
