// client/src/pages/clinic/ClinicPatientsPage/ClinicPatientsPage.jsx
//
// Patient management page for the current clinic.
//
// Features:
//   - List patients (paginated, cursor-based)
//   - Search by phone OR email OR lastName (debounced 400ms)
//   - Create patient inline via a slide-down form
//   - Delete patient (soft) with confirmation
//   - Show "created by" line under each patient name
//   - Clickable rows → patient detail page
//
// Permissions enforced server-side, but we hide write/delete buttons
// when role doesn't have permission to keep UX clean.
//
// Reuses the same .staff-page-* / .staff-row-* CSS tokens used by
// ClinicStaffPage for visual consistency.

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listPatients,
  createPatient,
  searchPatients,
  deletePatient,
} from "../../../api/clinic";
import "./clinicPatientsPage.css";

const SEARCH_DEBOUNCE_MS = 400;

export default function ClinicPatientsPage() {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [count, setCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchSeqRef = useRef(0); // race-condition guard for debounced search

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const myRole = layoutContext?.role || "member";
  const permissions = layoutContext?.permissions || {};
  const canWrite =
    !!permissions?.patient?.write ||
    ["owner", "admin", "receptionist"].includes(myRole);
  const canDelete =
    !!permissions?.patient?.delete || ["owner", "admin"].includes(myRole);

  // ─── Load patients (cleared on any 401) ───
  const loadList = useCallback(async () => {
    try {
      setError(null);
      const res = await listPatients({ limit: 50 });
      setPatients(res.items || []);
      setCount(res.items?.length || 0);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load patients:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load patients");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ─── Debounced search ───
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const q = searchQuery.trim();
    if (q.length === 0) {
      loadList();
      setIsSearching(false);
      return;
    }
    if (q.length < 2) {
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      setIsSearching(true);
      try {
        const isPhone = /^[\d\s+\-()]+$/.test(q);
        const isEmail = q.includes("@");
        const params = isPhone
          ? { phone: q }
          : isEmail
            ? { email: q }
            : { lastName: q };

        const res = await searchPatients({ ...params, limit: 50 });
        if (seq !== searchSeqRef.current) return;
        setPatients(res.items || []);
        setCount(res.items?.length || 0);
      } catch (err) {
        if (seq !== searchSeqRef.current) return;
        console.error("Search failed:", err);
        setPatients([]);
        setCount(0);
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ─── Create patient submit ───
  async function handleCreateSubmit(e) {
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
      await createPatient(data);
      form.reset();
      setCreateOpen(false);
      await loadList();
    } catch (err) {
      const msg = err.response?.data?.error || "";
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
        setFormErrors({ _form: msg || t("patients.errors.createFailed") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(patient) {
    const name = patientDisplayName(patient);
    if (!window.confirm(t("patients.confirmDelete", { name }))) return;
    const id = patient._id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await deletePatient(id);
      await loadList();
    } catch (err) {
      alert(err.response?.data?.error || t("patients.errors.deleteFailed"));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  function patientDisplayName(p) {
    return (
      [p.firstName, p.lastName].filter(Boolean).join(" ") ||
      p.phone ||
      p.email ||
      t("patients.unnamed")
    );
  }

  function formatDob(d) {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return null;
    }
  }

  if (loading) {
    return (
      <div className="staff-page-loading">
        <div className="staff-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-page-error">
        <h2>{t("patients.errorTitle")}</h2>
        <p>{error}</p>
        <button onClick={loadList}>{t("common.retry")}</button>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <div className="staff-page-header">
        <div className="staff-page-header-left">
          <Link to="/clinic/dashboard" className="staff-page-back">
            {t("patients.back")}
          </Link>
          <h1>{t("patients.title")}</h1>
          <p className="staff-page-subtitle">{t("patients.subtitle")}</p>
        </div>
        {canWrite && (
          <div className="staff-page-header-actions">
            <button
              className="staff-page-btn-primary"
              onClick={() => setCreateOpen((v) => !v)}
              type="button"
            >
              {createOpen ? t("common.cancel") : t("patients.addPatient")}
            </button>
          </div>
        )}
      </div>

      {/* ─── Inline create form ─── */}
      {createOpen && (
        <section className="patients-create-form">
          <form onSubmit={handleCreateSubmit}>
            <div className="patients-form-row">
              <div className="patients-form-field">
                <label>{t("patients.fields.firstName")} *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  autoFocus
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
                <input type="date" name="dateOfBirth" />
              </div>
              <div className="patients-form-field">
                <label>
                  {t("patients.fields.gender")}{" "}
                  <span className="patients-form-optional">
                    {t("common.optional")}
                  </span>
                </label>
                <select name="gender" defaultValue="">
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
                  setCreateOpen(false);
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
                {submitting
                  ? t("common.submitting")
                  : t("patients.createSubmit")}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── Search ─── */}
      <section className="staff-page-section">
        <div className="patients-search-row">
          <input
            type="text"
            className="patients-search-input"
            placeholder={t("patients.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <span className="patients-search-status">
              {t("common.loading")}
            </span>
          )}
        </div>
      </section>

      {/* ─── List ─── */}
      <section className="staff-page-section">
        <h2>
          {searchQuery.trim().length > 0
            ? t("patients.searchResults")
            : t("patients.allPatients")}
          <span className="staff-page-count">{count}</span>
        </h2>

        {patients.length === 0 ? (
          <div className="staff-page-empty">
            <p>
              {searchQuery.trim().length > 0
                ? t("patients.noSearchResults")
                : t("patients.noPatients")}
            </p>
            {canWrite && searchQuery.trim().length === 0 && (
              <button
                className="staff-page-btn-primary"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                {t("patients.addFirstPatient")}
              </button>
            )}
          </div>
        ) : (
          <div className="staff-page-list">
            {patients.map((p) => (
              <PatientRow
                key={p._id}
                patient={p}
                canDelete={canDelete}
                onDelete={handleDelete}
                isLoading={!!actionLoading[p._id]}
                displayName={patientDisplayName(p)}
                formatDob={formatDob}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ───

function PatientRow({
  patient,
  canDelete,
  onDelete,
  isLoading,
  displayName,
  formatDob,
  t,
}) {
  const initial = (displayName[0] || "?").toUpperCase();
  const dob = formatDob(patient.dateOfBirth);

  return (
    <div
      className={`staff-row patient-row-clickable ${isLoading ? "is-loading" : ""}`}
    >
      <Link to={`/clinic/patients/${patient._id}`} className="patient-row-link">
        <div className="staff-row-avatar patient-avatar">{initial}</div>
        <div className="staff-row-info">
          <div className="staff-row-name">{displayName}</div>
          {patient.createdByName && (
            <div className="patient-created-by">
              {t("patients.createdBy")}: {patient.createdByName}
            </div>
          )}
          <div className="staff-row-email patient-meta">
            {patient.phone && <span>{patient.phone}</span>}
            {patient.phone && (patient.email || dob) && (
              <span className="patient-meta-sep">·</span>
            )}
            {patient.email && <span>{patient.email}</span>}
            {patient.email && dob && (
              <span className="patient-meta-sep">·</span>
            )}
            {dob && (
              <span>
                {t("patients.dob")}: {dob}
              </span>
            )}
            {!patient.phone && !patient.email && !dob && (
              <span>{t("patients.noContact")}</span>
            )}
          </div>
        </div>
      </Link>
      {patient.linkedUserId && (
        <div className="staff-row-role">
          <span className="patient-linked-badge">
            {t("patients.linkedBadge")}
          </span>
        </div>
      )}
      <div className="staff-row-actions">
        {canDelete && (
          <button
            className="staff-row-btn-remove"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(patient);
            }}
            disabled={isLoading}
            type="button"
          >
            {t("patients.delete")}
          </button>
        )}
      </div>
    </div>
  );
}
