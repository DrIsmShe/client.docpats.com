// client/src/pages/clinic/ClinicKnowledgePage/KnowledgeFormModal.jsx
//
// Create / edit a knowledge article. The parent passes an async `onSubmit`
// that performs the actual create or update call — this modal only gathers
// fields, validates lightly, and surfaces server-side field errors.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./knowledgeFormModal.css";

const CATEGORIES = [
  "protocol",
  "guideline",
  "sop",
  "onboarding",
  "faq",
  "policy",
  "template",
  "other",
];
const VISIBILITIES = ["all", "clinical", "admin"];

function extractId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  return "";
}

export default function KnowledgeFormModal({
  article,
  departments = [],
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = Boolean(article);

  const [title, setTitle] = useState(article?.title || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [category, setCategory] = useState(article?.category || "protocol");
  const [departmentId, setDepartmentId] = useState(
    extractId(article?.departmentId),
  );
  const [visibility, setVisibility] = useState(article?.visibility || "all");
  const [tagsText, setTagsText] = useState((article?.tags || []).join(", "));
  const [body, setBody] = useState(article?.body || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setFieldErrors({
        title: t("knowledge.form.errors.titleRequired", {
          defaultValue: "Введите заголовок",
        }),
      });
      return;
    }

    const tags = tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);

    const payload = {
      title: title.trim(),
      category,
      visibility,
      body,
      tags,
      ...(summary.trim() && { summary: summary.trim() }),
      // department: send id, or null to clear (only meaningful on edit)
      ...(departmentId
        ? { departmentId }
        : isEdit
          ? { departmentId: null }
          : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data?.details?.issues) {
        const errs = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) errs[field] = issue.message;
        }
        setFieldErrors(errs);
        setError(
          t("knowledge.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("knowledge.form.errors.generic", {
              defaultValue: "Не удалось сохранить статью",
            }),
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window kb-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>
            {isEdit
              ? t("knowledge.form.editTitle", {
                  defaultValue: "Редактировать статью",
                })
              : t("knowledge.form.createTitle", {
                  defaultValue: "Новая статья",
                })}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label={t("common.cancel", { defaultValue: "Отмена" })}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {error && <div className="modal-error">{error}</div>}

          {/* Title */}
          <div className="modal-field">
            <label htmlFor="kb-title">
              {t("knowledge.form.titleLabel", { defaultValue: "Заголовок" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="kb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={300}
              className={fieldErrors.title ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.title && (
              <div className="modal-field-error">{fieldErrors.title}</div>
            )}
          </div>

          {/* Category + Visibility */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="kb-category">
                {t("knowledge.form.category", { defaultValue: "Категория" })}
              </label>
              <select
                id="kb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`knowledge.category.${c}`, { defaultValue: c })}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label htmlFor="kb-visibility">
                {t("knowledge.form.visibility", { defaultValue: "Доступ" })}
              </label>
              <select
                id="kb-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                disabled={submitting}
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {t(`knowledge.visibility.${v}`, { defaultValue: v })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department (optional) */}
          <div className="modal-field">
            <label htmlFor="kb-dept">
              {t("knowledge.form.department", { defaultValue: "Отделение" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <select
              id="kb-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
            >
              <option value="">
                {t("knowledge.form.departmentNone", {
                  defaultValue: "— вся клиника —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="modal-field">
            <label htmlFor="kb-summary">
              {t("knowledge.form.summary", {
                defaultValue: "Краткое описание",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <input
              id="kb-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={submitting}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div className="modal-field">
            <label htmlFor="kb-tags">
              {t("knowledge.form.tags", { defaultValue: "Теги" })}{" "}
              <span className="optional">
                {t("knowledge.form.tagsHint", {
                  defaultValue: "через запятую",
                })}
              </span>
            </label>
            <input
              id="kb-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              disabled={submitting}
              placeholder="triage, covid, реанимация"
            />
          </div>

          {/* Body (markdown) */}
          <div className="modal-field">
            <label htmlFor="kb-body">
              {t("knowledge.form.body", { defaultValue: "Содержимое" })}{" "}
              <span className="optional">Markdown</span>
            </label>
            <textarea
              id="kb-body"
              className="kb-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              rows={14}
              placeholder={t("knowledge.form.bodyPlaceholder", {
                defaultValue:
                  "# Заголовок\n\nТекст протокола. Поддерживается **жирный**, *курсив*, списки, `код`.",
              })}
            />
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel", { defaultValue: "Отмена" })}
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={submitting}
            >
              {submitting
                ? t("common.saving", { defaultValue: "Сохранение…" })
                : t("common.save", { defaultValue: "Сохранить" })}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
