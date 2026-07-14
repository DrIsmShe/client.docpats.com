// client/src/pages/clinic/EmployeeDashboardPage/EmployeeChangePasswordCard.jsx
//
// Change-password card for the employee cabinet.
//
// Requires the CURRENT password: a hijacked session alone must not be enough to
// lock the rightful owner out of their own account. The server enforces this
// too (employeePassword.service.js) — this is only the UI half.
//
// Like EmployeeDashboardPage, this file is deliberately pure ASCII: icons come
// from lucide-react and every string goes through t(), so no editor or terminal
// can corrupt the text.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound } from "lucide-react";
import { employeeChangePassword } from "../../../api/clinic";

const MIN_PASSWORD_LENGTH = 8; // keep in sync with employeePassword.schemas.js

export default function EmployeeChangePasswordCard() {
  const { t } = useTranslation("clinic");

  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setRepeat("");
    setShowPassword(false);
    setError(null);
    setFieldErrors({});
  }

  function validate() {
    const errors = {};
    if (!currentPassword) {
      errors.currentPassword = t("employeeChangePassword.errors.currentRequired");
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = t("employeeChangePassword.errors.newShort", {
        count: MIN_PASSWORD_LENGTH,
      });
    }
    if (newPassword && newPassword === currentPassword) {
      errors.newPassword = t("employeeChangePassword.errors.sameAsCurrent");
    }
    if (newPassword !== repeat) {
      errors.repeat = t("employeeChangePassword.errors.mismatch");
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (Object.keys(v).length > 0) {
      setFieldErrors(v);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await employeeChangePassword({ currentPassword, newPassword });
      reset();
      setDone(true);
      setOpen(false);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        // The server tells "current password is incorrect" apart from
        // "not authenticated" only by message; for the user both mean: retype.
        setFieldErrors({
          currentPassword: t("employeeChangePassword.errors.currentWrong"),
        });
      } else if (status === 400) {
        setError(t("employeeChangePassword.errors.sameAsCurrent"));
      } else {
        setError(t("employeeLogin.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="employee-dashboard-section">
      <h2>{t("employeeChangePassword.sectionTitle")}</h2>

      <div className="employee-password-card">
        <div className="employee-password-head">
          <span className="employee-dashboard-info-icon">
            <KeyRound size={22} />
          </span>
          <div>
            <div className="employee-dashboard-info-value">
              {t("employeeChangePassword.title")}
            </div>
            <div className="employee-dashboard-info-sub">
              {t("employeeChangePassword.hint")}
            </div>
          </div>

          {!open && (
            <button
              type="button"
              className="employee-password-btn"
              onClick={() => {
                setDone(false);
                setOpen(true);
              }}
            >
              {t("employeeChangePassword.open")}
            </button>
          )}
        </div>

        {done && (
          <div className="employee-password-success">
            {t("employeeChangePassword.success")}
          </div>
        )}

        {open && (
          <form className="employee-password-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="employee-password-error">{error}</div>}

            <div className="employee-password-field">
              <label htmlFor="currentPassword">
                {t("employeeChangePassword.fields.current")}
              </label>
              <input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (fieldErrors.currentPassword) {
                    setFieldErrors((p) => ({ ...p, currentPassword: undefined }));
                  }
                }}
                disabled={submitting}
                autoComplete="current-password"
              />
              {fieldErrors.currentPassword && (
                <div className="employee-password-field-error">
                  {fieldErrors.currentPassword}
                </div>
              )}
            </div>

            <div className="employee-password-field">
              <label htmlFor="newPassword">
                {t("employeeChangePassword.fields.new")}
              </label>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((p) => ({ ...p, newPassword: undefined }));
                  }
                }}
                disabled={submitting}
                autoComplete="new-password"
              />
              {fieldErrors.newPassword && (
                <div className="employee-password-field-error">
                  {fieldErrors.newPassword}
                </div>
              )}
            </div>

            <div className="employee-password-field">
              <label htmlFor="repeatPassword">
                {t("employeeChangePassword.fields.repeat")}
              </label>
              <input
                id="repeatPassword"
                type={showPassword ? "text" : "password"}
                value={repeat}
                onChange={(e) => {
                  setRepeat(e.target.value);
                  if (fieldErrors.repeat) {
                    setFieldErrors((p) => ({ ...p, repeat: undefined }));
                  }
                }}
                disabled={submitting}
                autoComplete="new-password"
              />
              {fieldErrors.repeat && (
                <div className="employee-password-field-error">
                  {fieldErrors.repeat}
                </div>
              )}
            </div>

            <label className="employee-password-show">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={submitting}
              />{" "}
              {t("employeeResetPassword.showPassword")}
            </label>

            <div className="employee-password-actions">
              <button
                type="submit"
                className="employee-password-btn"
                disabled={submitting}
              >
                {submitting
                  ? t("employeeChangePassword.submitting")
                  : t("employeeChangePassword.submit")}
              </button>
              <button
                type="button"
                className="employee-password-btn-ghost"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                disabled={submitting}
              >
                {t("employeeChangePassword.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
