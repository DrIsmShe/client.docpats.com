// client/src/pages/clinic/ClinicConsiliumPage/ConsiliumFormModal.jsx
//
// Create a consilium. The parent passes an async `onSubmit`. patientId is
// optional and entered as a free id field for the MVP (a patient picker can
// be wired in later); leaving it blank creates a general case discussion.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./consiliumFormModal.css";

export default function ConsiliumFormModal({
  departments = [],
  staff = [],
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation("clinic");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [participants, setParticipants] = useState(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function membershipIdOf(m) {
    return String(m.membershipId || m._id || m.id);
  }
  function staffName(m) {
    return (
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.email ||
      m.username ||
      "—"
    );
  }
  function toggle(id) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setFieldErrors({
        title: t("consilium.form.errors.titleRequired", {
          defaultValue: "Введите тему",
        }),
      });
      return;
    }

    const payload = {
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(departmentId && { departmentId }),
      participantMembershipIds: Array.from(participants),
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
          t("consilium.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("consilium.form.errors.generic", {
              defaultValue: "Не удалось создать консилиум",
            }),
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window cons-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>
            {t("consilium.form.createTitle", {
              defaultValue: "Новый консилиум",
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

          <div className="modal-field">
            <label htmlFor="cons-title">
              {t("consilium.form.titleLabel", { defaultValue: "Тема случая" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="cons-title"
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

          <div className="modal-field">
            <label htmlFor="cons-desc">
              {t("consilium.form.description", {
                defaultValue: "Описание случая",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="cons-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={4}
              maxLength={5000}
              placeholder={t("consilium.form.descriptionHint", {
                defaultValue:
                  "Краткое изложение. Не указывайте прямые идентификаторы пациента в теме.",
              })}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="cons-dept">
              {t("consilium.form.department", { defaultValue: "Отделение" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <select
              id="cons-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
            >
              <option value="">
                {t("consilium.form.departmentNone", {
                  defaultValue: "— не указано —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label>
              {t("consilium.form.participants", {
                defaultValue: "Участники",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            {staff.length === 0 ? (
              <div className="modal-hint">
                {t("consilium.form.noStaff", {
                  defaultValue: "В клинике пока нет сотрудников",
                })}
              </div>
            ) : (
              <div className="cons-staff-list">
                {staff.map((m) => {
                  const mid = membershipIdOf(m);
                  return (
                    <label key={mid} className="cons-staff-item">
                      <input
                        type="checkbox"
                        checked={participants.has(mid)}
                        onChange={() => toggle(mid)}
                        disabled={submitting}
                      />
                      <span>{staffName(m)}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                ? t("common.saving", { defaultValue: "Создание…" })
                : t("consilium.form.createBtn", { defaultValue: "Создать" })}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
