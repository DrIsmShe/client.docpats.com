// client/src/pages/clinic/ClinicStaffPage/InviteEmployeeModal.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createInvitation } from "../../../api/clinic";
import "./inviteEmployeeModal.css";

const ROLES = [
  "receptionist",
  "nurse",
  "accountant",
  "pharmacist",
  "marketer",
  "manager",
  "admin",
];

const LANGUAGE_CODES = ["ru", "en", "tr", "az", "ar"];

export default function InviteEmployeeModal({ onClose, onSuccess }) {
  const { t, i18n } = useTranslation("clinic");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("receptionist");
  const [customTitle, setCustomTitle] = useState("");
  const [language, setLanguage] = useState(
    (i18n.language || "en").split("-")[0],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: t("inviteModal.errors.emailRequired") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: t("inviteModal.errors.emailInvalid") });
      return;
    }

    setSubmitting(true);
    try {
      await createInvitation({
        email: email.trim().toLowerCase(),
        role,
        ...(customTitle.trim() && { customTitle: customTitle.trim() }),
        language,
      });
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
        setError(t("inviteModal.errors.fixErrors"));
      } else if (status === 409) {
        setError(t("inviteModal.errors.alreadyMember"));
      } else {
        setError(data?.error || t("inviteModal.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{t("inviteModal.title")}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t("common.cancel")}
            type="button"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          <p className="modal-intro">{t("inviteModal.intro")}</p>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="invite-email">
              {t("inviteModal.fields.email")}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("inviteModal.fields.emailPlaceholder")}
              disabled={submitting}
              className={fieldErrors.email ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.email && (
              <div className="modal-field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="modal-field">
            <label htmlFor="invite-role">
              {t("inviteModal.fields.role")} <span className="required">*</span>
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`, { defaultValue: r })}
                </option>
              ))}
            </select>
            <div className="modal-hint">{t("inviteModal.fields.roleHint")}</div>
          </div>

          <div className="modal-field">
            <label htmlFor="invite-title">
              {t("inviteModal.fields.customTitle")}{" "}
              <span className="optional">{t("common.optional")}</span>
            </label>
            <input
              id="invite-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t("inviteModal.fields.customTitlePlaceholder")}
              disabled={submitting}
              maxLength={100}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="invite-lang">
              {t("inviteModal.fields.language")}
            </label>
            <select
              id="invite-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={submitting}
            >
              {LANGUAGE_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`languages.${code}`)}
                </option>
              ))}
            </select>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={submitting}
            >
              {submitting ? t("inviteModal.sending") : t("inviteModal.submit")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
