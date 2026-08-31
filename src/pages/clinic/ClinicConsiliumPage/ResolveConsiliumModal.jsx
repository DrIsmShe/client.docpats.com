// client/src/pages/clinic/ClinicConsiliumPage/ResolveConsiliumModal.jsx
//
// Small modal to resolve a consilium with a conclusion. Parent passes an
// async onSubmit(conclusion).

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./consiliumFormModal.css";
import "../formModal.css";

export default function ResolveConsiliumModal({ onClose, onSubmit }) {
  const { t } = useTranslation("clinic");
  const [conclusion, setConclusion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(conclusion.trim());
    } catch (err) {
      setError(
        err.response?.data?.error ||
          t("consilium.resolveFailed", {
            defaultValue: "Не удалось завершить консилиум",
          }),
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop dp-modal" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            {t("consilium.resolveTitle", {
              defaultValue: "Завершить консилиум",
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
            <label htmlFor="cons-conclusion">
              {t("consilium.form.conclusion", { defaultValue: "Заключение" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="cons-conclusion"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              disabled={submitting}
              rows={5}
              maxLength={5000}
              placeholder={t("consilium.form.conclusionHint", {
                defaultValue: "Итоговое решение консилиума…",
              })}
              autoFocus
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
                : t("consilium.resolve", { defaultValue: "Завершить" })}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
