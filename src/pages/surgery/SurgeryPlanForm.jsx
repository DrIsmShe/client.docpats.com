import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import instance from "../../axios";
import styles from "./Surgery.module.css";
import plan from "./SurgeryPlan.module.css";
import { getSchema } from "./PLAN_SCHEMAS";

export default function SurgeryPlanForm({ cas }) {
  const { t } = useTranslation("Surgery");
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeSection, setSection] = useState(0);
  const [error, setError] = useState("");

  const schema = getSchema(cas?.procedure, t);

  // ─── Загрузить существующий план ───────────────────────────────────────
  useEffect(() => {
    if (cas?.plan?.structured) {
      setData(cas.plan.structured);
    }
  }, [cas]);

  // ─── Обновить поле ────────────────────────────────────────────────────
  const set = useCallback((sectionIdx, key, value) => {
    setData((prev) => ({
      ...prev,
      [`s${sectionIdx}_${key}`]: value,
    }));
    setSaved(false);
  }, []);

  // ─── Автосохранение ───────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!cas?._id) return;
    setSaving(true);
    setError("");
    try {
      await instance.put(`/api/surgery/cases/${cas._id}`, {
        plan: { structured: data, text: buildTextPlan(schema, data, t) },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(t("planForm.saveError"));
    } finally {
      setSaving(false);
    }
  }, [cas, data, schema, t]);

  // ─── Генерация PDF ────────────────────────────────────────────────────
  const generatePDF = async () => {
    setGenerating(true);
    setError("");
    try {
      await save(); // сохраняем перед генерацией
      const res = await instance.get(`/api/surgery/cases/${cas._id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `surgery-plan-${cas._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("planForm.pdfError"));
    } finally {
      setGenerating(false);
    }
  };

  if (!cas) return null;

  return (
    <div className={plan.wrap}>
      {/* ─── Навигация по секциям ──── */}
      <div className={plan.sectionNav}>
        {schema.sections.map((sec, i) => (
          <button
            key={i}
            className={`${plan.navBtn} ${activeSection === i ? plan.navBtnActive : ""}`}
            onClick={() => setSection(i)}
          >
            <span className={plan.navIcon}>{sec.icon}</span>
            <span className={plan.navLabel}>{sec.title}</span>
          </button>
        ))}
      </div>

      {/* ─── Текущая секция ──────────── */}
      <div className={plan.formBody}>
        {schema.sections.map((sec, sIdx) => (
          <div
            key={sIdx}
            className={plan.section}
            style={{ display: sIdx === activeSection ? "block" : "none" }}
          >
            <div className={plan.sectionHeader}>
              <span className={plan.sectionIcon}>{sec.icon}</span>
              <h3 className={plan.sectionTitle}>{sec.title}</h3>
            </div>

            <div className={plan.fields}>
              {sec.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={data[`s${sIdx}_${field.key}`]}
                  onChange={(val) => set(sIdx, field.key, val)}
                />
              ))}
            </div>

            {/* Навигация вперёд/назад */}
            <div className={plan.secNav}>
              {sIdx > 0 && (
                <button
                  className={styles.btnSecondary}
                  onClick={() => setSection(sIdx - 1)}
                >
                  {t("planForm.back")}
                </button>
              )}
              <div style={{ flex: 1 }} />
              {sIdx < schema.sections.length - 1 && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => setSection(sIdx + 1)}
                >
                  {t("planForm.next")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Панель действий ─────────── */}
      <div className={plan.actions}>
        {error && <div className={styles.errorBox}>{error}</div>}
        <div className={plan.actionRow}>
          <div className={plan.progress}>
            <span className={plan.progressText}>
              {activeSection + 1} / {schema.sections.length} —{" "}
              {schema.sections[activeSection]?.title}
            </span>
            <div className={plan.progressBar}>
              <div
                className={plan.progressFill}
                style={{
                  width: `${((activeSection + 1) / schema.sections.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className={plan.actionBtns}>
            <button
              className={`${styles.btnSecondary} ${saved ? plan.savedBtn : ""}`}
              onClick={save}
              disabled={saving}
            >
              {saving
                ? t("planForm.saving")
                : saved
                  ? t("planForm.saved")
                  : t("planForm.save")}
            </button>
            <button
              className={styles.btnPrimary}
              onClick={generatePDF}
              disabled={generating || saving}
            >
              {generating
                ? t("planForm.generating")
                : t("planForm.downloadPdf")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Рендер отдельного поля ──────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }) {
  const { t } = useTranslation("Surgery");
  const inputClass = `${styles.input}`;

  switch (field.type) {
    case "text":
    case "number":
      return (
        <div className={plan.field}>
          <label className={plan.label}>{field.label}</label>
          <input
            className={inputClass}
            type={field.type}
            value={value || ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "textarea":
      return (
        <div className={plan.field}>
          <label className={plan.label}>{field.label}</label>
          <textarea
            className={styles.textarea}
            value={value || ""}
            placeholder={field.placeholder || ""}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "select":
      return (
        <div className={plan.field}>
          <label className={plan.label}>{field.label}</label>
          <select
            className={styles.select}
            style={{ width: "100%" }}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{t("planForm.selectPlaceholder")}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "radio":
      return (
        <div className={plan.field}>
          <label className={plan.label}>{field.label}</label>
          <div className={plan.radioGroup}>
            {field.options.map((opt) => (
              <label key={opt} className={plan.radioOption}>
                <input
                  type="radio"
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <div className={plan.field}>
          <label className={plan.checkboxRow}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        </div>
      );

    case "checklist":
      return (
        <div className={plan.field}>
          <label className={plan.label}>{field.label}</label>
          <div className={plan.checklist}>
            {field.options.map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={opt} className={plan.checkItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        onChange([...arr, opt]);
                      } else {
                        onChange(arr.filter((v) => v !== opt));
                      }
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ─── Построить текстовое резюме плана ────────────────────────────────────────
function buildTextPlan(schema, data, t) {
  const lines = [];
  schema.sections.forEach((sec, sIdx) => {
    lines.push(`\n### ${sec.title}`);
    sec.fields.forEach((field) => {
      const val = data[`s${sIdx}_${field.key}`];
      if (!val || (Array.isArray(val) && val.length === 0)) return;
      if (Array.isArray(val)) {
        lines.push(`${field.label}: ${val.join(", ")}`);
      } else if (typeof val === "boolean") {
        if (val) lines.push(`${field.label}: ${t("planForm.yes")}`);
      } else {
        lines.push(`${field.label}: ${val}`);
      }
    });
  });
  return lines.join("\n");
}
