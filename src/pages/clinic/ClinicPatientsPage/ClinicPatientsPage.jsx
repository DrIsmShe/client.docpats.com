// client/src/pages/clinic/ClinicPatientsPage/ClinicPatientsPage.jsx
//
// Patient management page for the current clinic.
//
// ZONE-AWARE (owner vs employee):
//   The same component is mounted under TWO route trees:
//     /clinic/patients            → owner/admin zone  (ClinicLayout)
//     /clinic/employee/patients   → employee zone     (ClinicLayout employeeMode)
//   It detects the zone from the layout context (`kind === "employee"`)
//   with a pathname fallback, and builds ALL internal links from a
//   computed `basePath`. This keeps the receptionist inside the employee
//   zone instead of bouncing them to the owner zone (which would 401 →
//   /login because they have session.employeeId, not session.userId).
//
//   Patient rows are clickable in BOTH zones. The detail page gates its
//   medical layer behind medical_record permission, so a receptionist
//   opening a card sees contacts/demographics + booking, but no PHI.
//
// Features:
//   - List patients (paginated, cursor-based)
//   - Search by phone OR email OR lastName (debounced 400ms)
//   - "Add patient" button routes to the registration wizard.
//   - Delete patient (soft) with confirmation
//   - Show "created by" line under each patient name
//
// Permissions enforced server-side, but we hide write/delete buttons
// when role doesn't have permission to keep UX clean.

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Link,
  useOutletContext,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listPatients,
  searchPatients,
  deletePatient,
} from "../../../api/clinic";
import "../clinicPageShell.css";
import "./clinicPatientsPage.css";

const SEARCH_DEBOUNCE_MS = 400;

export default function ClinicPatientsPage() {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Zone detection (owner vs employee) ───
  // Employee layout injects { kind: "employee", ... }; owner layout does not.
  // Pathname fallback covers any context shape drift.
  const isEmployee =
    layoutContext?.kind === "employee" ||
    location.pathname.startsWith("/clinic/employee");

  const basePath = isEmployee ? "/clinic/employee" : "/clinic";
  const loginPath = isEmployee ? "/clinic/staff-login" : "/login";
  const dashboardPath = isEmployee ? "/clinic/employee" : "/clinic/dashboard";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [count, setCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchSeqRef = useRef(0); // race-condition guard for debounced search

  const [actionLoading, setActionLoading] = useState({});

  // Employee context carries `role` directly; owner context carries
  // role + permissions. Receptionist gets write via role fallback.
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
        navigate(loginPath, { replace: true });
        return;
      }
      setError(err.message || "Failed to load patients");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loginPath]);

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

  // ─── Delete patient ───
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
          <Link to={dashboardPath} className="staff-page-back">
            {t("patients.back")}
          </Link>
          <h1>{t("patients.title")}</h1>
          <p className="staff-page-subtitle">{t("patients.subtitle")}</p>
        </div>
        {canWrite && (
          <div className="staff-page-header-actions">
            <Link
              to={`${basePath}/patients/new`}
              className="staff-page-btn-primary"
            >
              {t("patients.addPatient", {
                defaultValue: "+ Добавить пациента",
              })}
            </Link>
          </div>
        )}
      </div>

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
              <Link
                to={`${basePath}/patients/new`}
                className="staff-page-btn-primary"
              >
                {t("patients.addFirstPatient", {
                  defaultValue: "Добавить первого пациента",
                })}
              </Link>
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
                basePath={basePath}
                clickable={true}
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
  basePath,
  clickable,
}) {
  const initial = (displayName[0] || "?").toUpperCase();
  const dob = formatDob(patient.dateOfBirth);

  // Inner content is identical in both modes; only the wrapper differs
  // (clickable <Link> for owner, plain <div> for employee — no detail
  // page for receptionists yet, since it exposes the medical record).
  const inner = (
    <>
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
          {patient.email && dob && <span className="patient-meta-sep">·</span>}
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
    </>
  );

  return (
    <div
      className={`staff-row ${clickable ? "patient-row-clickable" : ""} ${
        isLoading ? "is-loading" : ""
      }`}
    >
      {clickable ? (
        <Link
          to={`${basePath}/patients/${patient._id}`}
          className="patient-row-link"
        >
          {inner}
        </Link>
      ) : (
        <div className="patient-row-link patient-row-static">{inner}</div>
      )}
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
