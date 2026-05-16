// client/src/pages/clinic/ClinicCalendarPage/InlinePatientCreate.jsx
//
// Inline patient-creation form, embedded in BookAppointmentModal.
//
// Purpose: when the receptionist (or owner / admin) is booking an
// appointment and the patient isn't in the system yet, they shouldn't
// have to leave the modal, go to /clinic/patients, create the patient,
// come back, and re-pick the slot. They just create the patient right
// here and continue.
//
// Permission: bookable-modal callers already gate by canBook =
// owner/admin/receptionist — exactly the same set that has
// patient.write on the backend (verified in clinic-patients/service.js:
// requirePerm("patient","write")). No extra gate needed inside this
// component.
//
// Fields (minimum for receptionist intake):
//   - lastName    *required, pre-filled from the search query
//   - firstName   *required
//   - phone       optional
//   - dateOfBirth optional
//
// Email / gender / notes are deferred — they're rarely known during
// a phone-in booking and can be filled in later via the patient detail
// page.
//
// On submit: POST /api/v1/clinic/patients via createPatient.
//   200 → call onCreated(patient); parent (BookAppointmentModal) sets
//         the returned patient as selectedPatient and the rest of the
//         booking flow proceeds.
//   409 → "this phone already belongs to another patient" — the
//         backend's blind-index duplicate check (clinic-patients/service.js).
//         We surface the message and let the user remove the phone or
//         search by it instead.
//
// Conventions follow the rest of the calendar module: no <form>,
// no localStorage, t() with defaultValue everywhere, t not in deps.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { createPatient } from "../../../api/clinic";

export default function InlinePatientCreate({
  initialLastName = "",
  onCreated,
  onCancel,
}) {
  const { t } = useTranslation("clinic");

  const [lastName, setLastName] = useState(initialLastName);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit() {
    setErrorMsg(null);
    setFieldErrors({});

    // Client-side validation mirrors the bare minimum the backend will
    // enforce. Both names are required, the rest is optional.
    const errors = {};
    if (!lastName.trim())
      errors.lastName = t("calendar.inlineCreate.errors.lastNameRequired", {
        defaultValue: "Last name is required",
      });
    if (!firstName.trim())
      errors.firstName = t("calendar.inlineCreate.errors.firstNameRequired", {
        defaultValue: "First name is required",
      });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      dateOfBirth: dateOfBirth || null,
    };

    setSubmitting(true);
    try {
      const res = await createPatient(payload);
      // patient.controller wraps successful creates as { patient: {...} }
      const created = res?.patient || res;
      onCreated(created);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Backend's blind-index duplicate-phone check
        setFieldErrors({
          phone: t("calendar.inlineCreate.errors.duplicatePhone", {
            defaultValue: "A patient with this phone already exists",
          }),
        });
      } else if (status === 403) {
        // Should be unreachable — the parent modal hides this UI for
        // non-write roles. Defensive message just in case.
        setErrorMsg(
          t("calendar.inlineCreate.errors.forbidden", {
            defaultValue: "You don't have permission to create patients",
          }),
        );
      } else {
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.inlineCreate.errors.generic", {
              defaultValue: "Failed to create patient",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ccal-inline-create">
      <div className="ccal-detail-section">
        <h4>
          {t("calendar.inlineCreate.title", {
            defaultValue: "Create new patient",
          })}
        </h4>

        <div className="ccal-field">
          <span>
            {t("calendar.inlineCreate.lastName", {
              defaultValue: "Last name",
            })}{" "}
            *
          </span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoFocus
          />
          {fieldErrors.lastName && (
            <small className="ccal-msg is-err">{fieldErrors.lastName}</small>
          )}
        </div>

        <div className="ccal-field">
          <span>
            {t("calendar.inlineCreate.firstName", {
              defaultValue: "First name",
            })}{" "}
            *
          </span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          {fieldErrors.firstName && (
            <small className="ccal-msg is-err">{fieldErrors.firstName}</small>
          )}
        </div>

        <div className="ccal-field">
          <span>
            {t("calendar.inlineCreate.phone", { defaultValue: "Phone" })}
          </span>
          <input
            type="text"
            value={phone}
            placeholder="+994 50 123 45 67"
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldErrors.phone && (
            <small className="ccal-msg is-err">{fieldErrors.phone}</small>
          )}
        </div>

        <div className="ccal-field">
          <span>
            {t("calendar.inlineCreate.dateOfBirth", {
              defaultValue: "Date of birth",
            })}
          </span>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        {errorMsg && <div className="ccal-msg is-err">{errorMsg}</div>}

        <div className="ccal-modal-actions">
          <button
            type="button"
            className="ccal-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            {t("calendar.inlineCreate.cancel", { defaultValue: "Cancel" })}
          </button>
          <button
            type="button"
            className="ccal-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "…"
              : t("calendar.inlineCreate.submit", {
                  defaultValue: "Create and select",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
