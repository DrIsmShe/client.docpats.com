import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import { createStudy } from "../store/studiesSlice.js";

const STUDY_TYPES = ["pre_op", "post_op", "follow_up"];

/* ─── NewStudyModal ──────────────────────────────────────────
   Форма создания новой session антропометрии.
   ──────────────────────────────────────────────────────────── */

function NewStudyModal({ isOpen, caseId, onClose, onCreated }) {
  const { t } = useTranslation("Anthropometry");
  const dispatch = useDispatch();

  const todayIso = () => new Date().toISOString().split("T")[0];

  const [label, setLabel] = useState("");
  const [studyType, setStudyType] = useState("pre_op");
  const [studyDate, setStudyDate] = useState(todayIso());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLabel("");
      setStudyType("pre_op");
      setStudyDate(todayIso());
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studyType) {
      setError(t("common.error"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      studyType,
      studyDate: studyDate
        ? new Date(studyDate).toISOString()
        : new Date().toISOString(),
    };
    if (label.trim()) payload.label = label.trim();

    try {
      const result = await dispatch(
        createStudy({ caseId, data: payload }),
      ).unwrap();
      onClose();
      if (onCreated) onCreated(result);
    } catch (err) {
      setError(err?.message || "Failed to create study");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{t("studies.new")}</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.formErrorBanner}>{error}</div>}

            {/* Study type */}
            <div className={styles.formField}>
              <label
                className={`${styles.formLabel} ${styles.formLabelRequired}`}
                htmlFor="studyType"
              >
                {t("studies.type")}
              </label>
              <select
                id="studyType"
                className={styles.formSelect}
                value={studyType}
                onChange={(e) => setStudyType(e.target.value)}
                disabled={submitting}
              >
                {STUDY_TYPES.map((key) => (
                  <option key={key} value={key}>
                    {t(`studies.types.${key}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Label (optional) */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="label">
                {t("studies.label")}
              </label>
              <input
                id="label"
                type="text"
                className={styles.formInput}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("studies.labelPlaceholder")}
                autoFocus
                disabled={submitting}
              />
            </div>

            {/* Date */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="studyDate">
                {t("studies.date")}
              </label>
              <input
                id="studyDate"
                type="date"
                className={styles.formInput}
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

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
              {submitting ? t("common.loading") : t("studies.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewStudyModal;
