// client/src/pages/clinic/ClinicDepartmentsPage/DepartmentFormModal.jsx

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createDepartment,
  updateDepartment,
  listStaff,
} from "../../../api/clinic";
import "./departmentFormModal.css";

// Keep in sync with DEPARTMENT_SPECIALTIES (backend model enum).
// Keep in sync with DEPARTMENT_SPECIALTIES (backend model enum).
const SPECIALTIES = [
  "general",
  "family_medicine",
  "internal_medicine",
  "therapy",
  "pediatrics",
  "neonatology",
  "geriatrics",
  "emergency_medicine",
  "intensive_care",
  "anesthesiology",
  "cardiology",
  "cardiac_surgery",
  "vascular_surgery",
  "thoracic_surgery",
  "phlebology",
  "neurology",
  "neurosurgery",
  "psychiatry",
  "psychology",
  "psychotherapy",
  "addiction_medicine",
  "gastroenterology",
  "hepatology",
  "endocrinology",
  "nutrition",
  "nephrology",
  "urology",
  "andrology",
  "gynecology",
  "obstetrics",
  "reproductive_medicine",
  "mammology",
  "pulmonology",
  "rheumatology",
  "orthopedics",
  "traumatology",
  "sports_medicine",
  "hematology",
  "oncology",
  "radiation_oncology",
  "immunology",
  "allergology",
  "transfusion_medicine",
  "infectious_diseases",
  "dermatology",
  "venereology",
  "cosmetology",
  "plastic_surgery",
  "ent",
  "audiology",
  "ophthalmology",
  "surgery",
  "pediatric_surgery",
  "proctology",
  "transplantology",
  "dentistry",
  "orthodontics",
  "maxillofacial_surgery",
  "radiology",
  "nuclear_medicine",
  "pathology",
  "laboratory_medicine",
  "microbiology",
  "genetics",
  "rehabilitation",
  "physiotherapy",
  "pain_medicine",
  "palliative_care",
  "occupational_medicine",
  "preventive_medicine",
  "forensic_medicine",
  "other",
];

export default function DepartmentFormModal({
  department,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = Boolean(department);

  const [name, setName] = useState(department?.name || "");
  const [code, setCode] = useState(department?.code || "");
  const [specialty, setSpecialty] = useState(
    department?.specialty || "general",
  );
  const [description, setDescription] = useState(department?.description || "");
  const [headMembershipId, setHeadMembershipId] = useState(
    department?.headMembershipId ? String(department.headMembershipId) : "",
  );

  const [staff, setStaff] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Staff list — for the "head of department" selector. Optional: if it
  // fails, the rest of the form still works (head stays unset/unchanged).
  useEffect(() => {
    let cancelled = false;
    listStaff()
      .then((res) => {
        if (!cancelled) setStaff(res.items || []);
      })
      .catch(() => {
        /* ignore — head selection is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function staffName(m) {
    return (
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.email ||
      m.username ||
      "—"
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({
        name: t("departments.form.errors.nameRequired", {
          defaultValue: "Введите название",
        }),
      });
      return;
    }

    const payload = {
      name: name.trim(),
      specialty,
      ...(code.trim() && { code: code.trim() }),
      ...(description.trim() && { description: description.trim() }),
      // "" → null clears the head; otherwise the membership id.
      headMembershipId: headMembershipId || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateDepartment(department._id || department.id, payload);
      } else {
        await createDepartment(payload);
      }
      onSuccess();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data?.details?.issues) {
        const fe = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) fe[field] = issue.message;
        }
        setFieldErrors(fe);
        setError(
          t("departments.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else if (status === 409) {
        setFieldErrors({
          code: t("departments.form.errors.codeTaken", {
            defaultValue: "Такой код уже используется в клинике",
          }),
        });
        setError(
          t("departments.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("departments.form.errors.generic", {
              defaultValue: "Не удалось сохранить отделение",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            {isEdit
              ? t("departments.form.editTitle", {
                  defaultValue: "Редактировать отделение",
                })
              : t("departments.form.createTitle", {
                  defaultValue: "Новое отделение",
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

          {/* Name */}
          <div className="modal-field">
            <label htmlFor="dept-name">
              {t("departments.form.name", { defaultValue: "Название" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={200}
              className={fieldErrors.name ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.name && (
              <div className="modal-field-error">{fieldErrors.name}</div>
            )}
          </div>

          {/* Code */}
          <div className="modal-field">
            <label htmlFor="dept-code">
              {t("departments.form.code", { defaultValue: "Код" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <input
              id="dept-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              maxLength={32}
              placeholder="NEURO"
              className={fieldErrors.code ? "has-error" : ""}
            />
            {fieldErrors.code && (
              <div className="modal-field-error">{fieldErrors.code}</div>
            )}
            <div className="modal-hint">
              {t("departments.form.codeHint", {
                defaultValue: "Короткий код, уникальный в пределах клиники",
              })}
            </div>
          </div>

          {/* Specialty */}
          <div className="modal-field">
            <label htmlFor="dept-specialty">
              {t("departments.form.specialty", {
                defaultValue: "Специализация",
              })}
            </label>
            <select
              id="dept-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={submitting}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {t(`specialty.${s}`, { defaultValue: s })}
                </option>
              ))}
            </select>
          </div>

          {/* Head of department */}
          <div className="modal-field">
            <label htmlFor="dept-head">
              {t("departments.form.head", {
                defaultValue: "Заведующий отделением",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <select
              id="dept-head"
              value={headMembershipId}
              onChange={(e) => setHeadMembershipId(e.target.value)}
              disabled={submitting}
            >
              <option value="">
                {t("departments.form.headNone", {
                  defaultValue: "— не назначен —",
                })}
              </option>
              {staff.map((m) => {
                const id = m.membershipId || m._id || m.id;
                return (
                  <option key={id} value={id}>
                    {staffName(m)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Description */}
          <div className="modal-field">
            <label htmlFor="dept-desc">
              {t("departments.form.description", { defaultValue: "Описание" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              maxLength={2000}
              rows={3}
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
