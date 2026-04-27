import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import { createCase } from "../store/casesSlice.js";

/* ─── Процедуры ─────────────────────────────────────────────────
   Ключи соответствуют enum на бэкенде + переводам в i18n.
   ──────────────────────────────────────────────────────────── */
const PROCEDURE_KEYS = [
  "rhinoplasty",
  "mammoplasty",
  "facelift",
  "blepharoplasty",
  "liposuction",
  "otoplasty",
  "other",
];

/* ─── NewCaseModal ──────────────────────────────────────────────
   Форма создания нового case-а.
   MVP: всегда приватный пациент (inline создание в той же транзакции).
   F.4.4+ (будущее): добавить выбор "Зарегистрированный" с поиском
   существующих пациентов по базе.
   ──────────────────────────────────────────────────────────── */

function NewCaseModal({ isOpen, onClose }) {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* локальное состояние формы */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [procedureType, setProcedureType] = useState("rhinoplasty");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /* сбрасываем форму при открытии */
  useEffect(() => {
    if (isOpen) {
      setFirstName("");
      setLastName("");
      setProcedureType("rhinoplasty");
      setChiefComplaint("");
      setMedicalNotes("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  /* закрытие по Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* клиентская валидация */
    if (!firstName.trim()) {
      setError("Имя пациента обязательно");
      return;
    }
    if (!lastName.trim()) {
      setError("Фамилия пациента обязательна");
      return;
    }
    if (!procedureType) {
      setError(t("common.error") + ": " + t("cases.procedure"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      patientType: "private", // MVP: всегда приватный
      procedureType,
      chiefComplaint: chiefComplaint.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined,
      /* inline создание приватного пациента */
      privatePatient: {
        firstName: firstName.trim(),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
      },
    };

    try {
      const result = await dispatch(createCase(payload)).unwrap();
      const newCaseId = result._id;
      onClose();
      navigate(`/doctor/anthropometry/cases/${newCaseId}`);
    } catch (err) {
      setError(err?.message || "Failed to create case");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{t("cases.new")}</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.formErrorBanner}>{error}</div>}

            {/* First Name */}
            <div className={styles.formField}>
              <label
                className={`${styles.formLabel} ${styles.formLabelRequired}`}
                htmlFor="firstName"
              >
                Имя
              </label>
              <input
                id="firstName"
                type="text"
                className={styles.formInput}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                autoFocus
                disabled={submitting}
              />
            </div>

            {/* Last Name */}
            <div className={styles.formField}>
              <label
                className={`${styles.formLabel} ${styles.formLabelRequired}`}
                htmlFor="lastName"
              >
                Фамилия
              </label>
              <input
                id="lastName"
                type="text"
                className={styles.formInput}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
                disabled={submitting}
              />
            </div>

            {/* Procedure Type */}
            <div className={styles.formField}>
              <label
                className={`${styles.formLabel} ${styles.formLabelRequired}`}
                htmlFor="procedureType"
              >
                {t("cases.procedure")}
              </label>
              <select
                id="procedureType"
                className={styles.formSelect}
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
                disabled={submitting}
              >
                {PROCEDURE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`cases.procedureTypes.${key}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Chief Complaint */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chiefComplaint">
                {t("cases.chiefComplaint")}
              </label>
              <textarea
                id="chiefComplaint"
                className={styles.formTextarea}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            {/* Medical Notes */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="medicalNotes">
                {t("cases.medicalNotes")}
              </label>
              <textarea
                id="medicalNotes"
                className={styles.formTextarea}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                disabled={submitting}
                rows={2}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              {submitting ? t("common.loading") : t("cases.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewCaseModal;
