// client/src/pages/clinic/ClinicStaffPage/InviteAdminModal.jsx
//
// Invite a DocPats User (by email) to become a clinic ADMIN ("near-owner").
// Distinct from InviteEmployeeModal (which creates a ClinicEmployee via OTP).
// Here the invitee becomes a User + ClinicMembership(actorType "user").
//
// Role is FIXED to "admin" — this modal exists specifically for admins, and
// the backend membership-invite schema only accepts admin anyway. Only the
// clinic owner can open this (STAFF_INVITE is owner-only), enforced by the
// parent page (canInviteAdmin) and re-checked server-side.
//
// Reuses the shared modal styles from inviteEmployeeModal.css (.modal-*).

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createMembershipInvite } from "../../../api/clinic";
import "./inviteEmployeeModal.css";

const LANGUAGE_CODES = ["ru", "en", "tr", "az", "ar"];

export default function InviteAdminModal({ onClose, onSuccess }) {
  const { t, i18n } = useTranslation("clinic");

  const [email, setEmail] = useState("");
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
      setFieldErrors({ email: t("inviteAdminModal.errors.emailRequired") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: t("inviteAdminModal.errors.emailInvalid") });
      return;
    }

    setSubmitting(true);
    try {
      await createMembershipInvite({
        email: email.trim().toLowerCase(),
        role: "admin", // fixed
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
        setError(t("inviteAdminModal.errors.fixErrors"));
      } else if (status === 409) {
        setError(t("inviteAdminModal.errors.alreadyPending"));
      } else if (status === 403) {
        setError(t("inviteAdminModal.errors.forbidden"));
      } else {
        setError(data?.error || t("inviteAdminModal.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{t("inviteAdminModal.title")}</h2>
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
          <p className="modal-intro">{t("inviteAdminModal.intro")}</p>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="invite-admin-email">
              {t("inviteAdminModal.fields.email")}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="invite-admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("inviteAdminModal.fields.emailPlaceholder")}
              disabled={submitting}
              className={fieldErrors.email ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.email && (
              <div className="modal-field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="modal-field">
            <label htmlFor="invite-admin-title">
              {t("inviteAdminModal.fields.customTitle")}{" "}
              <span className="optional">{t("common.optional")}</span>
            </label>
            <input
              id="invite-admin-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t("inviteAdminModal.fields.customTitlePlaceholder")}
              disabled={submitting}
              maxLength={100}
            />
            <div className="modal-hint">
              {t("inviteAdminModal.fields.roleNote")}
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="invite-admin-lang">
              {t("inviteAdminModal.fields.language")}
            </label>
            <select
              id="invite-admin-lang"
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
              {submitting
                ? t("inviteAdminModal.sending")
                : t("inviteAdminModal.submit")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
