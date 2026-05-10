// client/src/pages/clinic/ClinicStaffPage/InviteEmployeeModal.jsx

import React, { useState } from "react";
import { createInvitation } from "../../../api/clinic";
import "./inviteEmployeeModal.css";

const ROLES = [
  { value: "receptionist", label: "Receptionist" },
  { value: "nurse", label: "Nurse" },
  { value: "accountant", label: "Accountant" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "marketer", label: "Marketer" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "az", label: "Azərbaycanca" },
  { value: "ar", label: "العربية" },
];

export default function InviteEmployeeModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("receptionist");
  const [customTitle, setCustomTitle] = useState("");
  const [language, setLanguage] = useState("en");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: "Email is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: "Invalid email" });
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
        setError("Please fix the errors below");
      } else if (status === 409) {
        setError("This email is already invited or a member.");
      } else {
        setError(data?.error || "Failed to send invitation");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Invite employee</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          <p className="modal-intro">
            We'll email an invitation link. The recipient will set up a password
            and join your clinic as a staff member (no public DocPats profile).
          </p>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="invite-email">
              Email <span className="required">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna.smith@example.com"
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
              Role <span className="required">*</span>
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="modal-hint">
              Defines what they can see and do in the clinic.
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="invite-title">
              Custom title <span className="optional">(optional)</span>
            </label>
            <input
              id="invite-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Senior Receptionist"
              disabled={submitting}
              maxLength={100}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="invite-lang">Email language</label>
            <select
              id="invite-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={submitting}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
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
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send invitation"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
