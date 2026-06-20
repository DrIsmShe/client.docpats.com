// client/src/pages/clinic/ClinicPatientDetailPage/LabResultFormModal.jsx
//
// Modal for entering a lab result (Stage 2 #A, Variant X).
//
// Flow: pick panel (from labtestParameterTemplates — 20 reused panels) →
// parameters auto-fill (name/unit/valueType/referenceRange) → enter values →
// live flag (norm / ↑ high / ↓ low / ‼ critical) shown per row → optionally
// attach original file → save.
//
// Uses the same .med-modal-* / .patients-form-* / .rx-* classes as
// PrescriptionFormModal. Server recomputes flags on save (this is just UX).

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createLabResult } from "../../../api/clinic";
import ICD10Autocomplete from "../../../components/ICD10Autocomplete";
// 20 reusable panel templates. labtestParameterTemplates exports TEST_TYPES
// plus the panel arrays. We import the whole namespace and read panels by key.
import {
  TEST_TYPES,
  LABTEST_PARAMETER_TEMPLATES,
  LABELS_RU,
} from "../../polyclinic/addpatientpolyclinic/addExaminations/labtestParameterTemplates";

// Panels live inside LABTEST_PARAMETER_TEMPLATES. Support both shapes:
//  (a) object keyed by panel id: { BloodTestGeneral: [...params], ... }
//  (b) array of { id|type|key, parameters|params|rows: [...] }
const PANELS = (() => {
  const src = LABTEST_PARAMETER_TEMPLATES || {};
  if (Array.isArray(src)) {
    const map = {};
    for (const entry of src) {
      const id = entry?.id || entry?.type || entry?.key || entry?.name;
      const arr = entry?.parameters || entry?.params || entry?.rows || entry;
      if (id && Array.isArray(arr)) map[id] = arr;
    }
    return map;
  }
  return src; // object keyed by panel id
})();

const PANEL_LABELS = LABELS_RU || {};

// Panel id → our backend panelType enum.
// TEST_TYPES from the template file should already line up; this map is a
// safety net for any legacy naming differences.
const PANEL_TYPE_MAP = {
  BloodTestGeneral: "BloodTestGeneral",
  BloodTestBiochemistry: "BloodTestBiochemistry",
  UrineTest: "UrineTest",
  StoolTest: "StoolTest",
  HormonePanel: "HormonePanel",
  TumorMarkers: "TumorMarkers",
  PCR: "PCR",
  Immunology: "Immunology",
  GeneticScreening: "GeneticScreening",
  CoagulationPanel: "CoagulationPanel",
  LipidProfile: "LipidProfile",
  LiverFunction: "LiverFunction",
  RenalElectrolytes: "RenalElectrolytes",
  IronStudies: "IronStudies",
  DiabetesPanel: "DiabetesPanel",
  ThyroidPanel: "ThyroidPanel",
  CardiacMarkers: "CardiacMarkers",
  VitaminsTrace: "VitaminsTrace",
  InfectiousSerology: "InfectiousSerology",
  UrineAlbuminACR: "UrineAlbuminACR",
  StoolInflammation: "StoolInflammation",
  Other: "Other",
};

// ── client-side flag (mirror of server computeFlag; UX only) ──────────
function clientFlag(param, critFactor = 1.5) {
  if (!param) return "normal";
  if (param.valueType === "text") {
    const ref = param.referenceRange?.text;
    if (!ref) return "normal";
    return String(param.value ?? "")
      .trim()
      .toLowerCase() === String(ref).trim().toLowerCase()
      ? "normal"
      : "abnormal";
  }
  const v = Number(param.value);
  if (!Number.isFinite(v)) return "normal";
  const min = param.referenceRange?.min;
  const max = param.referenceRange?.max;
  const hasMin = min != null && Number.isFinite(Number(min));
  const hasMax = max != null && Number.isFinite(Number(max));
  if (!hasMin && !hasMax) return "normal";
  if (hasMax) {
    const mx = Number(max);
    if (v > mx) return v > mx * critFactor ? "critical_high" : "high";
  }
  if (hasMin) {
    const mn = Number(min);
    if (v < mn) return v < mn * (2 - critFactor) ? "critical_low" : "low";
  }
  return "normal";
}

const FLAG_META = {
  normal: { sym: "", cls: "lab-flag-normal" },
  high: { sym: "↑", cls: "lab-flag-high" },
  low: { sym: "↓", cls: "lab-flag-low" },
  critical_high: { sym: "‼↑", cls: "lab-flag-crit" },
  critical_low: { sym: "‼↓", cls: "lab-flag-crit" },
  abnormal: { sym: "⚠", cls: "lab-flag-high" },
};

// Build editable param rows from a template panel array.
function rowsFromTemplate(panelArr) {
  if (!Array.isArray(panelArr)) return [];
  return panelArr.map((tpl) => {
    const valueType =
      tpl.valueType === "number" || tpl.valueType === "text"
        ? tpl.valueType
        : tpl.options?.length
          ? "text"
          : "number";
    // template referenceRange may be "4.0-9.0" string, {min,max}, or text
    let refMin = null;
    let refMax = null;
    let refText = null;
    const rr = tpl.referenceRange;
    if (rr && typeof rr === "object") {
      refMin = rr.min ?? null;
      refMax = rr.max ?? null;
      refText = rr.text ?? null;
    } else if (typeof rr === "string" && rr.includes("-")) {
      const [a, b] = rr.split("-").map((s) => parseFloat(s.trim()));
      if (Number.isFinite(a)) refMin = a;
      if (Number.isFinite(b)) refMax = b;
    } else if (typeof rr === "string" && rr.trim()) {
      refText = rr.trim();
    }
    return {
      name: tpl.name,
      unit: tpl.unit || (valueType === "number" ? "" : "—"),
      valueType,
      value: "",
      options: Array.isArray(tpl.options) ? tpl.options : null,
      referenceRange: { min: refMin, max: refMax, text: refText },
    };
  });
}

function emptyRow() {
  return {
    name: "",
    unit: "",
    valueType: "number",
    value: "",
    options: null,
    referenceRange: { min: null, max: null, text: null },
  };
}

export default function LabResultFormModal({ patient, onClose, onSaved }) {
  const { t } = useTranslation("clinic");

  const panelIds = useMemo(() => {
    // Prefer TEST_TYPES order if present, else keys of PANELS that are arrays.
    if (Array.isArray(TEST_TYPES) && TEST_TYPES.length) {
      return TEST_TYPES.map((x) =>
        typeof x === "string" ? x : x.id || x.value,
      ).filter(Boolean);
    }
    return Object.keys(PANELS).filter((k) => Array.isArray(PANELS[k]));
  }, []);

  const [panel, setPanel] = useState("");
  const [panelTitle, setPanelTitle] = useState("");
  const [labName, setLabName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState([]);
  const [report, setReport] = useState("");
  const [diagnosis, setDiagnosis] = useState({
    code: "",
    codeTitle: "",
    text: "",
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function applyPanel(panelId) {
    setPanel(panelId);
    const arr = PANELS[panelId];
    setRows(rowsFromTemplate(arr));
    if (!panelTitle) {
      setPanelTitle(
        t(`medical.labResults.panels.${panelId}`, {
          defaultValue: PANEL_LABELS[panelId] || panelId,
        }),
      );
    }
  }

  function setRowField(idx, name, value) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [name]: value } : r)),
    );
  }
  function setRowRange(idx, key, value) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              referenceRange: {
                ...r.referenceRange,
                [key]: value === "" ? null : value,
              },
            }
          : r,
      ),
    );
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleICD10Select(selected) {
    if (!selected) {
      setDiagnosis({ code: "", codeTitle: "", text: "" });
      return;
    }
    setDiagnosis((prev) => ({
      code: selected.code,
      codeTitle: selected.title,
      text: prev.text || selected.title,
    }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    if (f && f.size > 20 * 1024 * 1024) {
      setErrors((p) => ({
        ...p,
        _file: t("medical.labResults.errors.fileTooBig", {
          defaultValue: "Файл слишком большой (макс. 20 МБ)",
        }),
      }));
      return;
    }
    setErrors((p) => {
      const n = { ...p };
      delete n._file;
      return n;
    });
    setFile(f);
  }

  function buildPayload() {
    const cleanRows = rows
      .filter((r) => r.name && String(r.name).trim())
      .filter((r) => String(r.value ?? "").trim() !== "")
      .map((r) => {
        const valueType = r.valueType === "text" ? "text" : "number";
        return {
          name: r.name.trim(),
          valueType,
          value: valueType === "number" ? Number(r.value) : String(r.value),
          unit: valueType === "number" ? r.unit || "" : "—",
          referenceRange:
            valueType === "number"
              ? { min: r.referenceRange.min, max: r.referenceRange.max }
              : { text: r.referenceRange.text },
        };
      });

    const payload = {
      panelType: PANEL_TYPE_MAP[panel] || "Other",
      panelTitle: panelTitle.trim() || null,
      labName: labName.trim() || null,
      effectiveDateTime: effectiveDate
        ? new Date(effectiveDate).toISOString()
        : undefined,
      parameters: cleanRows,
      report: report.trim() || null,
    };
    if (diagnosis.code.trim() || diagnosis.text.trim()) {
      payload.diagnosis = {
        code: diagnosis.code.trim(),
        codeTitle: diagnosis.codeTitle.trim(),
        text: diagnosis.text.trim(),
      };
    }
    return payload;
  }

  function validate(payload) {
    const errs = {};
    const hasParams = payload.parameters.length > 0;
    const hasReport = !!payload.report;
    const hasFile = !!file;
    if (!hasParams && !hasReport && !hasFile) {
      errs._form = t("medical.labResults.errors.empty", {
        defaultValue:
          "Заполните хотя бы один показатель, заключение или прикрепите файл",
      });
    }
    return errs;
  }

  async function handleSubmit() {
    const payload = buildPayload();
    const errs = validate(payload);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createLabResult(patient._id, payload, file);
      const saved = created.labResult || created;
      onSaved && onSaved(saved);
    } catch (err) {
      console.error("Failed to save lab result:", err);
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="med-modal med-modal-encounter"
        role="dialog"
        aria-modal="true"
      >
        <div className="med-modal-head">
          <h3>
            {t("medical.labResults.createTitle", {
              defaultValue: "Новый анализ",
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

        <div className="med-modal-body">
          {/* Panel + meta */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.labResults.panelTitle", {
                defaultValue: "Тип анализа",
              })}
            </legend>
            <div className="rx-item-row">
              <div className="patients-form-field">
                <label>
                  {t("medical.labResults.fields.panel", {
                    defaultValue: "Панель",
                  })}
                </label>
                <select
                  value={panel}
                  onChange={(e) => applyPanel(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">
                    {t("medical.labResults.selectPanel", {
                      defaultValue: "— выберите панель —",
                    })}
                  </option>
                  {panelIds.map((p) => (
                    <option key={p} value={p}>
                      {t(`medical.labResults.panels.${p}`, {
                        defaultValue: PANEL_LABELS[p] || p,
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="patients-form-field">
                <label>
                  {t("medical.labResults.fields.effectiveDate", {
                    defaultValue: "Дата забора",
                  })}
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="rx-item-row">
              <div className="patients-form-field">
                <label>
                  {t("medical.labResults.fields.panelTitle", {
                    defaultValue: "Название (отображается)",
                  })}
                </label>
                <input
                  type="text"
                  value={panelTitle}
                  onChange={(e) => setPanelTitle(e.target.value)}
                  disabled={submitting}
                  placeholder={t("medical.labResults.placeholders.panelTitle", {
                    defaultValue: "Общий анализ крови",
                  })}
                />
              </div>
              <div className="patients-form-field">
                <label>
                  {t("medical.labResults.fields.labName", {
                    defaultValue: "Лаборатория",
                  })}
                  <span className="patients-form-optional">
                    {t("common.optional", { defaultValue: "необязательно" })}
                  </span>
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  disabled={submitting}
                  placeholder="Synevo, Invitro..."
                />
              </div>
            </div>
          </fieldset>

          {/* Parameters */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.labResults.parametersTitle", {
                defaultValue: "Показатели",
              })}
            </legend>

            {rows.length === 0 ? (
              <p className="patients-form-hint">
                {t("medical.labResults.pickPanelHint", {
                  defaultValue:
                    "Выберите панель выше — показатели заполнятся автоматически. Или добавьте показатель вручную.",
                })}
              </p>
            ) : (
              <div className="lab-rows">
                {rows.map((r, idx) => {
                  const flag = clientFlag(r);
                  const meta = FLAG_META[flag] || FLAG_META.normal;
                  return (
                    <div key={idx} className="lab-row">
                      <div className="lab-row-name">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) =>
                            setRowField(idx, "name", e.target.value)
                          }
                          disabled={submitting}
                          placeholder={t(
                            "medical.labResults.fields.paramName",
                            {
                              defaultValue: "Показатель",
                            },
                          )}
                        />
                      </div>

                      <div className="lab-row-value">
                        {r.options && r.options.length ? (
                          <select
                            value={r.value}
                            onChange={(e) =>
                              setRowField(idx, "value", e.target.value)
                            }
                            disabled={submitting}
                            className={meta.cls}
                          >
                            <option value="">—</option>
                            {r.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={r.valueType === "number" ? "number" : "text"}
                            step="any"
                            value={r.value}
                            onChange={(e) =>
                              setRowField(idx, "value", e.target.value)
                            }
                            disabled={submitting}
                            className={meta.cls}
                            placeholder={t("medical.labResults.fields.value", {
                              defaultValue: "Значение",
                            })}
                          />
                        )}
                      </div>

                      <div className="lab-row-unit">
                        <input
                          type="text"
                          value={r.unit}
                          onChange={(e) =>
                            setRowField(idx, "unit", e.target.value)
                          }
                          disabled={submitting || r.valueType === "text"}
                          placeholder={t("medical.labResults.fields.unit", {
                            defaultValue: "Ед.",
                          })}
                        />
                      </div>

                      <div className="lab-row-ref">
                        {r.valueType === "number" ? (
                          <>
                            <input
                              type="number"
                              step="any"
                              value={r.referenceRange.min ?? ""}
                              onChange={(e) =>
                                setRowRange(idx, "min", e.target.value)
                              }
                              disabled={submitting}
                              placeholder={t("medical.labResults.fields.min", {
                                defaultValue: "мин",
                              })}
                            />
                            <span className="lab-ref-dash">–</span>
                            <input
                              type="number"
                              step="any"
                              value={r.referenceRange.max ?? ""}
                              onChange={(e) =>
                                setRowRange(idx, "max", e.target.value)
                              }
                              disabled={submitting}
                              placeholder={t("medical.labResults.fields.max", {
                                defaultValue: "макс",
                              })}
                            />
                          </>
                        ) : (
                          <input
                            type="text"
                            value={r.referenceRange.text ?? ""}
                            onChange={(e) =>
                              setRowRange(idx, "text", e.target.value)
                            }
                            disabled={submitting}
                            placeholder={t(
                              "medical.labResults.fields.refText",
                              {
                                defaultValue: "норма",
                              },
                            )}
                          />
                        )}
                      </div>

                      <div className={`lab-row-flag ${meta.cls}`}>
                        {meta.sym}
                      </div>

                      <button
                        type="button"
                        className="rx-item-remove"
                        onClick={() => removeRow(idx)}
                        disabled={submitting}
                        aria-label={t("common.remove", {
                          defaultValue: "Удалить",
                        })}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="staff-page-btn-secondary rx-add-item"
              onClick={addRow}
              disabled={submitting}
            >
              {t("medical.labResults.addParamButton", {
                defaultValue: "+ Добавить показатель",
              })}
            </button>
          </fieldset>

          {/* Report + diagnosis */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.labResults.reportTitle", {
                defaultValue: "Заключение",
              })}
              <span className="patients-form-optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </legend>
            <div className="patients-form-field">
              <textarea
                rows={3}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                disabled={submitting}
                placeholder={t("medical.labResults.placeholders.report", {
                  defaultValue: "Интерпретация результатов...",
                })}
              />
            </div>
            <div className="patients-form-field" style={{ marginTop: 12 }}>
              <ICD10Autocomplete
                value={
                  diagnosis.code
                    ? { code: diagnosis.code, title: diagnosis.codeTitle }
                    : null
                }
                onChange={handleICD10Select}
                placeholder={t("medical.encounters.placeholders.icdSearch", {
                  defaultValue: "Поиск МКБ-10...",
                })}
              />
            </div>
          </fieldset>

          {/* Attached original file */}
          <fieldset className="med-fieldset">
            <legend>
              {t("medical.labResults.fileTitle", {
                defaultValue: "Оригинал (PDF / фото)",
              })}
              <span className="patients-form-optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </legend>
            <div className="patients-form-field">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFile}
                disabled={submitting}
              />
              {file && (
                <span className="lab-file-name">
                  {file.name} ({Math.round(file.size / 1024)} КБ)
                </span>
              )}
              {errors._file && (
                <span className="patients-form-error">{errors._file}</span>
              )}
            </div>
          </fieldset>

          {errors._form && (
            <div className="patients-form-error patients-form-error-banner">
              {errors._form}
            </div>
          )}
        </div>

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
            className="staff-page-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("common.submitting", { defaultValue: "Сохранение..." })
              : t("medical.labResults.saveButton", {
                  defaultValue: "Сохранить анализ",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
