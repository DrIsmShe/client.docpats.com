import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";

/* ─── ConfirmDialog ───────────────────────────────────────────
   Универсальная модалка подтверждения для actions
   (archive, delete, etc.).

   Props:
   - isOpen
   - title
   - message
   - warning        (optional) — красный блок с предупреждением
   - reasonLabel    (optional) — если задан, показывает textarea
   - reasonRequired (bool)
   - confirmLabel
   - danger         (bool) — красная кнопка confirm
   - onConfirm: async (reason) => void
   - onClose
   ──────────────────────────────────────────────────────────── */

function ConfirmDialog({
  isOpen,
  title,
  message,
  warning,
  reasonLabel,
  reasonRequired = false,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation("Anthropometry");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
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

  const handleConfirm = async () => {
    if (reasonRequired && !reason.trim()) {
      setError(t("confirm.reasonRequired") || "Требуется указать причину");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err?.message || "Action failed");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={`${styles.modal} ${styles.confirmDialog}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {message && <p className={styles.confirmMessage}>{message}</p>}
          {warning && <div className={styles.confirmWarning}>{warning}</div>}

          {reasonLabel && (
            <div className={styles.formField}>
              <label
                className={`${styles.formLabel} ${
                  reasonRequired ? styles.formLabelRequired : ""
                }`}
              >
                {reasonLabel}
              </label>
              <textarea
                className={styles.formTextarea}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>
          )}

          {error && <div className={styles.formErrorBanner}>{error}</div>}
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
            type="button"
            className={danger ? styles.btnDanger : styles.btnPrimary}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? t("common.loading") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
