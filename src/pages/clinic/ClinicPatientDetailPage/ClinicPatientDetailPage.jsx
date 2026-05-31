// client/src/pages/clinic/ClinicPatientDetailPage/ClinicPatientDetailPage.jsx
//
// Patient detail page at /clinic/patients/:id
//
// Sections:
//   1. Header — name, avatar, linked badge, role-aware action buttons
//   2. View mode — read-only display of all patient fields including
//      createdBy (who registered this patient — doctor or staff)
//   3. Edit mode — same form as on the list page (inline toggle)
//   4. Link section — search a DocPats user (by email OR by date of
//      birth + name) and link the patient to that account
//   5. MEDICAL RECORDS SECTION (UMR) — Sprint 2 Phase 2D.2 — added
//      between the Link section and the book-appointment modal. Shows
//      encounter history with create/sign/amend flow (gated by canWrite),
//      plus tabs for allergies / chronic / operations / family /
//      immunization / imaging.
//   6. Delete button (visible to canDelete)
//   7. Book-appointment button (Sprint 1, day 5) — opens
//      BookFromPatientModal with this patient pre-filled
//
// Reuses .staff-page-* tokens and .patients-form-* tokens from the list
// page CSS to keep visual identity consistent. The appointment modal
// uses .ccal-* tokens from clinicCalendarPage.css — imported below.

import React, { useEffect, useState, useCallback } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPatient,
  updatePatient,
  deletePatient,
  linkPatientToUser,
  unlinkPatientFromUser,
  searchUsersForLink,
  createConsentRequest,
} from "../../../api/clinic";
import "../ClinicPatientsPage/clinicPatientsPage.css";
import "./clinicPatientDetailPage.css";
// Pull in the calendar-modal stylesheet so the .ccal-* classes used
// inside BookFromPatientModal are styled here too.
import "../ClinicCalendarPage/clinicCalendarPage.css";
import BookFromPatientModal from "../ClinicCalendarPage/BookFromPatientModal.jsx";
import ConsentRequestModal from "./ConsentRequestModal.jsx";

// Sprint 2 Phase 2D.2 — Unified Medical Record (UMR) section
import MedicalRecordsSection from "./MedicalRecordsSection.jsx";

export default function ClinicPatientDetailPage() {
  const { t, i18n } = useTranslation("clinic");
  const { id } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);

  const [editing, setEditing] = useState(false);
  // Sprint 3.2 — consent request modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestSubmitMsg, setRequestSubmitMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ─── Link section state ───
  const [linkOpen, setLinkOpen] = useState(false);
  // Search mode: "email" | "dob"
  const [linkMode, setLinkMode] = useState("email");
  // Input fields
  const [linkEmail, setLinkEmail] = useState("");
  const [linkDob, setLinkDob] = useState("");
  const [linkFirstName, setLinkFirstName] = useState("");
  const [linkLastName, setLinkLastName] = useState("");
  // Search state
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [searchError, setSearchError] = useState(null);
  // Linking state (after user picks a result)
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const myRole = layoutContext?.role || "member";
  const permissions = layoutContext?.permissions || {};
  const canWrite =
    !!permissions?.patient?.write ||
    ["owner", "admin", "receptionist"].includes(myRole);
  const canDelete =
    !!permissions?.patient?.delete || ["owner", "admin"].includes(myRole);
  // Booking permission mirrors backend WRITE_ROLES for appointments
  // (owner / admin / receptionist). The book modal does the same role
  // check on the doctor + slot pickers it renders inside.
  const canBook = ["owner", "admin", "receptionist"].includes(myRole);

  // ─── Permission for medical records (UMR) ───
  // Backend RBAC: owner/admin/doctor can write encounters & sub-records,
  // nurse can write anamnestic sub-records. We use a wide "canWriteMedical"
  // for the section header; finer-grained gating happens server-side.
  const canWriteMedical =
    !!permissions?.medical_record?.write ||
    ["owner", "admin", "doctor", "nurse"].includes(myRole);

  // ─── Load patient ───
  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getPatient(id);
      setPatient(res.patient || res);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load patient:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (err.response?.status === 404) {
        setError("not-found");
      } else {
        setError(err.message || "Failed to load patient");
      }
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Edit submit ───
  async function handleEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      phone: form.phone.value.trim() || null,
      email: form.email.value.trim() || null,
      gender: form.gender.value || null,
      dateOfBirth: form.dateOfBirth.value || null,
    };

    const errors = {};
    if (!data.firstName)
      errors.firstName = t("patients.errors.firstNameRequired");
    if (!data.lastName) errors.lastName = t("patients.errors.lastNameRequired");
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitting(true);

    try {
      const res = await updatePatient(id, data);
      setPatient(res.patient || res);
      setEditing(false);
      // Reload to fetch fresh createdByName etc (update doesn't include it)
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        setFormErrors({ phone: t("patients.errors.duplicatePhone") });
      } else if (err.response?.data?.details?.issues) {
        const fieldErrors = {};
        for (const issue of err.response.data.details.issues) {
          const path = issue.path?.[0];
          if (path) fieldErrors[path] = issue.message;
        }
        setFormErrors(fieldErrors);
      } else {
        setFormErrors({
          _form: err.response?.data?.error || t("patients.errors.updateFailed"),
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Link: reset all link-section state ───
  function resetLinkState() {
    setLinkOpen(false);
    setLinkMode("email");
    setLinkEmail("");
    setLinkDob("");
    setLinkFirstName("");
    setLinkLastName("");
    setSearching(false);
    setSearchResults(null);
    setSearchError(null);
    setLinkError(null);
  }

  // ─── Link: search for users ───
  async function handleUserSearch(e) {
    e.preventDefault();
    setSearchError(null);
    setLinkError(null);
    setSearchResults(null);

    // Client-side validation per mode
    if (linkMode === "email") {
      if (!linkEmail.trim()) {
        setSearchError(t("patients.linkSection.errors.emailRequired"));
        return;
      }
    } else if (linkMode === "dob") {
      if (!linkDob) {
        setSearchError(t("patients.linkSection.errors.dobRequired"));
        return;
      }
    }

    setSearching(true);
    try {
      const params =
        linkMode === "email"
          ? { mode: "email", email: linkEmail.trim() }
          : {
              mode: "dob",
              dateOfBirth: linkDob,
              firstName: linkFirstName.trim() || undefined,
              lastName: linkLastName.trim() || undefined,
            };
      const res = await searchUsersForLink(params);
      setSearchResults(res.items || []);
    } catch (err) {
      setSearchError(
        err.response?.data?.error ||
          t("patients.linkSection.errors.searchFailed"),
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // ─── Link: pick a user from search results → link ───
  async function handlePickUser(userId) {
    setLinkError(null);
    setLinkSubmitting(true);
    try {
      const res = await linkPatientToUser(id, userId);
      setPatient(res.patient || res);
      resetLinkState();
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) {
        setLinkError(t("patients.errors.linkUserNotFound"));
      } else if (status === 409) {
        setLinkError(t("patients.errors.linkAlreadyLinked"));
      } else {
        setLinkError(
          err.response?.data?.error || t("patients.errors.linkFailed"),
        );
      }
    } finally {
      setLinkSubmitting(false);
    }
  }

  async function handleUnlink() {
    if (!window.confirm(t("patients.confirmUnlink"))) return;
    setLinkSubmitting(true);
    try {
      const res = await unlinkPatientFromUser(id);
      setPatient(res.patient || res);
    } catch (err) {
      alert(err.response?.data?.error || t("patients.errors.unlinkFailed"));
    } finally {
      setLinkSubmitting(false);
    }
  }

  // ─── Delete ───
  async function handleDelete() {
    const name = displayName();
    if (!window.confirm(t("patients.confirmDelete", { name }))) return;
    setDeleting(true);
    try {
      await deletePatient(id);
      navigate("/clinic/patients", { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || t("patients.errors.deleteFailed"));
      setDeleting(false);
    }
  }

  // ─── Display helpers ───
  function displayName() {
    if (!patient) return "";
    return (
      [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
      patient.phone ||
      patient.email ||
      t("patients.unnamed")
    );
  }

  function formatDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "—";
    }
  }

  /**
   * Format the "created by" line: "Имя Фамилия (врач)" or fallback.
   */
  function formatCreatedBy() {
    if (!patient?.createdByName) {
      return t("patients.createdByUnknown");
    }
    const actorTypeLabel = t(
      `patients.createdByType.${patient.createdByType || "user"}`,
    );
    return `${patient.createdByName} (${actorTypeLabel})`;
  }

  /** Display name for a user search result. */
  function userResultName(u) {
    return (
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      u.username ||
      u.email ||
      t("patients.unnamed")
    );
  }

  // ─── Render guards ───
  if (loading) {
    return (
      <div className="staff-page-loading">
        <div className="staff-page-spinner" />
      </div>
    );
  }

  if (error === "not-found") {
    return (
      <div className="staff-page-error">
        <h2>{t("patients.notFoundTitle")}</h2>
        <p>{t("patients.notFoundText")}</p>
        <Link to="/clinic/patients" className="staff-page-btn-primary">
          {t("patients.backToList")}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-page-error">
        <h2>{t("patients.errorTitle")}</h2>
        <p>{error}</p>
        <button onClick={load}>{t("common.retry")}</button>
      </div>
    );
  }

  const name = displayName();
  const initial = (name[0] || "?").toUpperCase();

  return (
    <div className="staff-page">
      {/* ─── Header ─── */}
      <div className="staff-page-header">
        <div className="staff-page-header-left">
          <Link to="/clinic/patients" className="staff-page-back">
            {t("patients.backToList")}
          </Link>
          <div className="patient-detail-header">
            <div className="staff-row-avatar patient-avatar patient-detail-avatar">
              {initial}
            </div>
            <div>
              <h1>{name}</h1>
              {patient.linkedUserId && (
                <span className="patient-linked-badge">
                  {t("patients.linkedBadge")}
                </span>
              )}
            </div>
          </div>
        </div>
        {!editing && (
          <div className="staff-page-header-actions">
            {canBook && (
              <button
                className="staff-page-btn-primary"
                onClick={() => setBookModalOpen(true)}
                type="button"
              >
                {t("calendar.fromPatient.openButton", {
                  defaultValue: "Book appointment",
                })}
              </button>
            )}
            {canWrite && (
              <button
                className="staff-page-btn-secondary"
                onClick={() => setEditing(true)}
                type="button"
              >
                {t("patients.edit")}
              </button>
            )}
            {canDelete && (
              <button
                className="staff-page-btn-primary patient-detail-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                type="button"
              >
                {deleting ? t("common.loading") : t("patients.delete")}
              </button>
            )}
            {/* Sprint 3.2 — Запросить доступ к медданным */}
            {patient.linkedUserId ? (
              <button
                className="staff-page-btn-primary"
                onClick={() => setRequestModalOpen(true)}
                type="button"
                style={{ background: "#6366f1" }}
                title={t(
                  "patients.consentRequest.openButton",
                  "Запросить доступ",
                )}
              >
                {t("patients.consentRequest.openButton", "Запросить доступ")}
              </button>
            ) : (
              <button
                className="staff-page-btn-primary"
                disabled
                type="button"
                style={{ opacity: 0.5, cursor: "not-allowed" }}
                title={t(
                  "patients.consentRequest.notLinkedHint",
                  "Сначала свяжите карту с аккаунтом DocPats",
                )}
              >
                {t("patients.consentRequest.openButton", "Запросить доступ")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Edit mode ─── */}
      {editing ? (
        <section className="patients-create-form">
          <form onSubmit={handleEditSubmit}>
            <div className="patients-form-row">
              <div className="patients-form-field">
                <label>{t("patients.fields.firstName")} *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  autoFocus
                  defaultValue={patient.firstName || ""}
                  className={formErrors.firstName ? "has-error" : ""}
                />
                {formErrors.firstName && (
                  <span className="patients-form-error">
                    {formErrors.firstName}
                  </span>
                )}
              </div>
              <div className="patients-form-field">
                <label>{t("patients.fields.lastName")} *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  defaultValue={patient.lastName || ""}
                  className={formErrors.lastName ? "has-error" : ""}
                />
                {formErrors.lastName && (
                  <span className="patients-form-error">
                    {formErrors.lastName}
                  </span>
                )}
              </div>
            </div>
            <div className="patients-form-row">
              <div className="patients-form-field">
                <label>
                  {t("patients.fields.phone")}{" "}
                  <span className="patients-form-optional">
                    {t("common.optional")}
                  </span>
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={patient.phone || ""}
                  placeholder="+994 50 123 45 67"
                  className={formErrors.phone ? "has-error" : ""}
                />
                {formErrors.phone && (
                  <span className="patients-form-error">
                    {formErrors.phone}
                  </span>
                )}
              </div>
              <div className="patients-form-field">
                <label>
                  {t("patients.fields.email")}{" "}
                  <span className="patients-form-optional">
                    {t("common.optional")}
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={patient.email || ""}
                  placeholder="patient@example.com"
                  className={formErrors.email ? "has-error" : ""}
                />
                {formErrors.email && (
                  <span className="patients-form-error">
                    {formErrors.email}
                  </span>
                )}
              </div>
            </div>
            <div className="patients-form-row">
              <div className="patients-form-field">
                <label>
                  {t("patients.fields.dateOfBirth")}{" "}
                  <span className="patients-form-optional">
                    {t("common.optional")}
                  </span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  defaultValue={
                    patient.dateOfBirth
                      ? new Date(patient.dateOfBirth)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                />
              </div>
              <div className="patients-form-field">
                <label>
                  {t("patients.fields.gender")}{" "}
                  <span className="patients-form-optional">
                    {t("common.optional")}
                  </span>
                </label>
                <select name="gender" defaultValue={patient.gender || ""}>
                  <option value="">—</option>
                  <option value="male">{t("patients.gender.male")}</option>
                  <option value="female">{t("patients.gender.female")}</option>
                  <option value="other">{t("patients.gender.other")}</option>
                  <option value="unknown">
                    {t("patients.gender.unknown")}
                  </option>
                </select>
              </div>
            </div>

            {formErrors._form && (
              <div className="patients-form-error patients-form-error-banner">
                {formErrors._form}
              </div>
            )}

            <div className="patients-form-actions">
              <button
                type="button"
                className="staff-page-btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFormErrors({});
                }}
                disabled={submitting}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="staff-page-btn-primary"
                disabled={submitting}
              >
                {submitting ? t("common.submitting") : t("common.save")}
              </button>
            </div>
          </form>
        </section>
      ) : (
        /* ─── View mode ─── */
        <section className="staff-page-section">
          <h2>{t("patients.detailsTitle")}</h2>
          <div className="patient-detail-grid">
            <DetailRow
              label={t("patients.fields.firstName")}
              value={patient.firstName || "—"}
            />
            <DetailRow
              label={t("patients.fields.lastName")}
              value={patient.lastName || "—"}
            />
            <DetailRow
              label={t("patients.fields.phone")}
              value={patient.phone || "—"}
            />
            <DetailRow
              label={t("patients.fields.email")}
              value={patient.email || "—"}
            />
            <DetailRow
              label={t("patients.fields.dateOfBirth")}
              value={formatDate(patient.dateOfBirth)}
            />
            <DetailRow
              label={t("patients.fields.gender")}
              value={
                patient.gender ? t(`patients.gender.${patient.gender}`) : "—"
              }
            />
            <DetailRow
              label={t("patients.createdAt")}
              value={formatDate(patient.createdAt)}
            />
            <DetailRow
              label={t("patients.updatedAt")}
              value={formatDate(patient.updatedAt)}
            />
            <DetailRow
              label={t("patients.createdBy")}
              value={formatCreatedBy()}
              wide
            />
          </div>
        </section>
      )}

      {/* ─── Link to DocPats user ─── */}
      {!editing && canWrite && (
        <section className="staff-page-section">
          <h2>{t("patients.linkSection.title")}</h2>

          {patient.linkedUserId ? (
            /* Already linked — show current link + unlink button */
            <div className="patient-link-current">
              <div className="patient-link-info">
                <strong>{t("patients.linkSection.linkedTo")}</strong>
                <code>{patient.linkedUserId}</code>
              </div>
              <button
                className="staff-page-btn-secondary"
                onClick={handleUnlink}
                disabled={linkSubmitting}
                type="button"
              >
                {linkSubmitting
                  ? t("common.loading")
                  : t("patients.linkSection.unlink")}
              </button>
            </div>
          ) : linkOpen ? (
            /* Search panel — pick mode, enter criteria, see results */
            <div className="patient-link-search">
              {/* Mode switcher */}
              <div className="patient-link-modes">
                <button
                  type="button"
                  className={`patient-link-mode-btn ${
                    linkMode === "email" ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setLinkMode("email");
                    setSearchResults(null);
                    setSearchError(null);
                  }}
                >
                  {t("patients.linkSection.modeEmail")}
                </button>
                <button
                  type="button"
                  className={`patient-link-mode-btn ${
                    linkMode === "dob" ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setLinkMode("dob");
                    setSearchResults(null);
                    setSearchError(null);
                  }}
                >
                  {t("patients.linkSection.modeDob")}
                </button>
              </div>

              {/* Search form */}
              <form className="patient-link-form" onSubmit={handleUserSearch}>
                {linkMode === "email" ? (
                  <div className="patients-form-field">
                    <label>{t("patients.linkSection.emailLabel")}</label>
                    <input
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="patient@example.com"
                      autoFocus
                    />
                    <span className="patients-form-optional">
                      {t("patients.linkSection.emailHint")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="patients-form-field">
                      <label>{t("patients.linkSection.dobLabel")}</label>
                      <input
                        type="date"
                        value={linkDob}
                        onChange={(e) => setLinkDob(e.target.value)}
                        autoFocus
                      />
                      <span className="patients-form-optional">
                        {t("patients.linkSection.dobHint")}
                      </span>
                    </div>
                    <div className="patients-form-row">
                      <div className="patients-form-field">
                        <label>
                          {t("patients.fields.firstName")}{" "}
                          <span className="patients-form-optional">
                            {t("common.optional")}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={linkFirstName}
                          onChange={(e) => setLinkFirstName(e.target.value)}
                        />
                      </div>
                      <div className="patients-form-field">
                        <label>
                          {t("patients.fields.lastName")}{" "}
                          <span className="patients-form-optional">
                            {t("common.optional")}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={linkLastName}
                          onChange={(e) => setLinkLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {searchError && (
                  <div className="patients-form-error patients-form-error-banner">
                    {searchError}
                  </div>
                )}

                <div className="patients-form-actions">
                  <button
                    type="button"
                    className="staff-page-btn-secondary"
                    onClick={resetLinkState}
                    disabled={searching || linkSubmitting}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="staff-page-btn-primary"
                    disabled={searching || linkSubmitting}
                  >
                    {searching
                      ? t("common.loading")
                      : t("patients.linkSection.searchSubmit")}
                  </button>
                </div>
              </form>

              {/* Search results */}
              {searchResults !== null && (
                <div className="patient-link-results">
                  {searchResults.length === 0 ? (
                    <p className="patient-link-results-empty">
                      {t("patients.linkSection.noResults")}
                    </p>
                  ) : (
                    <>
                      <div className="patient-link-results-header">
                        {t("patients.linkSection.resultsTitle")}
                        <span className="staff-page-count">
                          {searchResults.length}
                        </span>
                      </div>
                      {linkError && (
                        <div className="patients-form-error patients-form-error-banner">
                          {linkError}
                        </div>
                      )}
                      <div className="patient-link-results-list">
                        {searchResults.map((u) => (
                          <UserResultRow
                            key={u._id}
                            user={u}
                            displayName={userResultName(u)}
                            formatDate={formatDate}
                            disabled={linkSubmitting}
                            onPick={() => handlePickUser(u._id)}
                            pickLabel={t("patients.linkSection.linkSubmit")}
                            roleLabel={
                              u.role
                                ? t(`patients.linkSection.role.${u.role}`, {
                                    defaultValue: u.role,
                                  })
                                : null
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Not linked, panel closed — prompt */
            <div className="patient-link-empty">
              <p>{t("patients.linkSection.notLinked")}</p>
              <button
                className="staff-page-btn-secondary"
                onClick={() => setLinkOpen(true)}
                type="button"
              >
                {t("patients.linkSection.linkButton")}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── Medical Records (UMR) — Sprint 2 Phase 2D.2 ─── */}
      {/* Visible only in view-mode (not while editing the patient profile). */}
      {!editing && patient && (
        <MedicalRecordsSection patient={patient} canWrite={canWriteMedical} />
      )}

      {/* ─── Book-appointment modal (day 5 second entry-point) ─── */}
      {bookModalOpen && patient && (
        <BookFromPatientModal
          patient={patient}
          onClose={() => setBookModalOpen(false)}
          onCreated={() => {
            setBookModalOpen(false);
            // Patient detail itself doesn't show an appointment history
            // yet (that's a separate widget), so no reload needed.
          }}
        />
      )}
      {/* Sprint 3.2 — Consent Request Modal */}
      <ConsentRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        patientName={name}
        onSubmit={async (payload) => {
          await createConsentRequest(patient._id, payload);
          setRequestModalOpen(false);
          setRequestSubmitMsg("success");
          setTimeout(() => setRequestSubmitMsg(null), 4000);
        }}
      />

      {/* Sprint 3.2 — Toast for success */}
      {requestSubmitMsg === "success" && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            padding: "14px 20px",
            background: "#dcfce7",
            color: "#14532d",
            border: "1px solid #86efac",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 9999,
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.2)",
          }}
        >
          {t(
            "patients.consentRequest.successToast",
            "✓ Запрос отправлен пациенту",
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, wide = false }) {
  return (
    <div
      className={`patient-detail-row ${wide ? "patient-detail-row-wide" : ""}`}
    >
      <span className="patient-detail-label">{label}</span>
      <span className="patient-detail-value">{value}</span>
    </div>
  );
}

function UserResultRow({
  user,
  displayName,
  formatDate,
  disabled,
  onPick,
  pickLabel,
  roleLabel,
}) {
  const initial = (displayName[0] || "?").toUpperCase();
  return (
    <div className="patient-link-result-row">
      <div className="staff-row-avatar patient-avatar">{initial}</div>
      <div className="patient-link-result-info">
        <div className="patient-link-result-name">
          {displayName}
          {roleLabel && (
            <span className="patient-link-result-role">{roleLabel}</span>
          )}
        </div>
        <div className="patient-link-result-meta">
          {user.email && <span>{user.email}</span>}
          {user.email && user.dateOfBirth && (
            <span className="patient-meta-sep">·</span>
          )}
          {user.dateOfBirth && <span>{formatDate(user.dateOfBirth)}</span>}
        </div>
      </div>
      <button
        type="button"
        className="staff-page-btn-primary"
        onClick={onPick}
        disabled={disabled}
      >
        {pickLabel}
      </button>
    </div>
  );
}
