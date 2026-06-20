// client/src/pages/clinic/ClinicCalendarPage/BookAppointmentModal.jsx
//
// Modal for booking a new appointment from the calendar.
//
// Opened from two places:
//   1. ClinicCalendarPage — user clicks "Book" on a free slot. The slot
//      and doctorId are known up-front; `prefilledPatient` is null.
//   2. ClinicPatientDetailPage uses a different wrapper (BookFromPatientModal),
//      not this one.
//
// Flow inside the modal:
//   1. PATIENT — search box with one field. Heuristic chooses the API:
//        starts with "+" or has ≥7 consecutive digits → searchPatients({ phone })
//        contains "@"                                 → searchPatients({ email })
//        otherwise                                    → searchPatients({ lastName })
//      Selected patient renders as a chip; can be cleared.
//      If the search returns no hits, an inline "Create new patient"
//      button appears, which expands InlinePatientCreate with the
//      search query pre-filled as the last name. On successful create,
//      the new patient becomes selectedPatient and the booking flow
//      continues — the slot, duration, and reason fields are preserved.
//      Permission: the modal itself is gated upstream to canBook
//      (owner/admin/receptionist) = exactly the roles that have
//      patient.write on the backend.
//
//   2. DEPARTMENT — optional dropdown of active clinic departments.
//      Routes the appointment to a department; null/"" = unassigned.
//
//   3. DURATION — pills 15/30/60/90 min. Default = the doctor's schedule
//      slotDurationMinutes, snapped to one of the four pill values.
//
//   4. REASON — optional, ≤2000 chars.
//
// On submit:
//   - compute endUTC = slot.startUTC + durationMinutes
//   - POST /appointments
//   - 409 → show "this time is taken" message
//
// Conventions:
//   - no <form>, no localStorage
//   - t() with defaultValue everywhere; t not in hook deps

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  searchPatients,
  createAppointment,
  listDepartments,
} from "../../../api/clinic";
import InlinePatientCreate from "./InlinePatientCreate";

// ─── Constants ────────────────────────────────────────────────

const DURATION_OPTIONS = [15, 30, 60, 90];

// Debounce for patient search — 300ms is the sweet spot for typing.
const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

// ─── Helpers ──────────────────────────────────────────────────

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Guess what KIND of search the input is — phone / email / lastName.
 */
function classifyPatientSearch(raw) {
  if (!raw) return { kind: null, value: "" };
  const trimmed = raw.trim();
  if (!trimmed) return { kind: null, value: "" };

  if (trimmed.includes("@")) return { kind: "email", value: trimmed };

  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (trimmed.startsWith("+") || digitCount >= 7) {
    return { kind: "phone", value: trimmed };
  }

  return { kind: "lastName", value: trimmed };
}

function pickDefaultDuration(slotDurationMinutes) {
  const n = Number(slotDurationMinutes) || 30;
  if (DURATION_OPTIONS.includes(n)) return n;
  return DURATION_OPTIONS.reduce((best, opt) =>
    Math.abs(opt - n) < Math.abs(best - n) ? opt : best,
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function BookAppointmentModal({
  doctorId,
  doctorName,
  slot,
  slotDurationMinutes,
  date,
  prefilledPatient = null,
  onClose,
  onCreated,
}) {
  const { t } = useTranslation("clinic");

  // ─── State ───
  const [selectedPatient, setSelectedPatient] = useState(prefilledPatient);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchedYet, setSearchedYet] = useState(false);
  // When true, render <InlinePatientCreate /> in place of the search hint
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const [duration, setDuration] = useState(() =>
    pickDefaultDuration(slotDurationMinutes),
  );
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── Load active departments once (optional field) ───
  useEffect(() => {
    let cancelled = false;
    listDepartments({ status: "active" })
      .then((res) => {
        if (!cancelled) setDepartments(res.items || []);
      })
      .catch(() => {
        /* department selection is optional — ignore failures */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Patient search (debounced) ───

  const searchSeqRef = useRef(0);

  const runSearch = useCallback(async (raw) => {
    const seq = ++searchSeqRef.current;
    const classified = classifyPatientSearch(raw);
    if (!classified.kind || classified.value.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchedYet(true);
    try {
      const params = { limit: 10 };
      if (classified.kind === "phone") params.phone = classified.value;
      else if (classified.kind === "email") params.email = classified.value;
      else params.lastName = classified.value;
      const res = await searchPatients(params);
      if (seq !== searchSeqRef.current) return;
      setSearchResults(res.items || []);
    } catch {
      if (seq !== searchSeqRef.current) return;
      setSearchResults([]);
    } finally {
      if (seq === searchSeqRef.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatient) return undefined;
    if (creatingPatient) return undefined;
    if (!searchQuery || searchQuery.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchedYet(false);
      return undefined;
    }
    const handle = setTimeout(() => runSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery, selectedPatient, creatingPatient, runSearch]);

  // ─── Inline-create handlers ───
  function handleInlineCreated(newPatient) {
    setSelectedPatient(newPatient);
    setCreatingPatient(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchedYet(false);
  }

  function handleInlineCancel() {
    setCreatingPatient(false);
  }

  function createButtonLabel() {
    const q = searchQuery.trim();
    if (!q)
      return t("calendar.inlineCreate.openButton", {
        defaultValue: "+ Create new patient",
      });
    const shortened = q.length > 30 ? q.slice(0, 30) + "…" : q;
    return t("calendar.inlineCreate.openButtonWithName", {
      defaultValue: '+ Create "{{name}}"',
      name: shortened,
    });
  }

  const showCreateButton =
    !creatingPatient &&
    !selectedPatient &&
    searchedYet &&
    !searching &&
    searchResults.length === 0 &&
    searchQuery.trim().length >= MIN_SEARCH_LENGTH &&
    classifyPatientSearch(searchQuery).kind === "lastName";

  // ─── Submit ───
  async function handleSubmit() {
    if (!selectedPatient) {
      setErrorMsg(
        t("calendar.book_modal.createError", {
          defaultValue: "Failed to create the appointment",
        }),
      );
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const startUTC = new Date(slot.startUTC);
      const endUTC = new Date(startUTC.getTime() + duration * 60 * 1000);

      await createAppointment({
        doctorId,
        patientId: selectedPatient._id,
        startUTC: startUTC.toISOString(),
        endUTC: endUTC.toISOString(),
        ...(departmentId && { departmentId }),
        ...(reason.trim() && { reason: reason.trim() }),
      });

      onCreated();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.book_modal.conflictError", {
              defaultValue: "That time is already taken by another appointment",
            }),
        );
      } else {
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.book_modal.createError", {
              defaultValue: "Failed to create the appointment",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───

  const slotTimeLabel = slot
    ? `${minutesToHHMM(slot.startMinute)}–${minutesToHHMM(
        slot.startMinute + duration,
      )}`
    : "—";

  const subtitle = t("calendar.book_modal.subtitle", {
    defaultValue: "{{time}} · {{doctor}}",
    time: slotTimeLabel,
    doctor: doctorName || "",
  });

  return (
    <div
      className="ccal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ccal-modal" role="dialog" aria-modal="true">
        <h3 className="ccal-modal-title">
          {t("calendar.book_modal.title", { defaultValue: "New appointment" })}
        </h3>
        <p className="ccal-modal-sub">{subtitle}</p>

        {/* Patient selector */}
        <div className="ccal-field">
          <span>
            {t("calendar.book_modal.patient", { defaultValue: "Patient" })}
          </span>

          {selectedPatient ? (
            <div className="ccal-chip">
              <span>
                {[selectedPatient.firstName, selectedPatient.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                  selectedPatient.phone ||
                  selectedPatient.email ||
                  "—"}
              </span>
              {!prefilledPatient && (
                <button
                  type="button"
                  className="ccal-chip-x"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ) : creatingPatient ? (
            <InlinePatientCreate
              initialLastName={searchQuery.trim()}
              onCreated={handleInlineCreated}
              onCancel={handleInlineCancel}
            />
          ) : (
            <>
              <input
                type="search"
                value={searchQuery}
                placeholder={t("calendar.book_modal.patientSearchPlaceholder", {
                  defaultValue: "Find a patient (last name, phone, or email)",
                })}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery.trim().length > 0 &&
                searchQuery.trim().length < MIN_SEARCH_LENGTH && (
                  <small className="ccal-modal-sub">
                    {t("calendar.book_modal.searchHint", {
                      defaultValue: "At least 2 characters",
                    })}
                  </small>
                )}
              {searching && <small className="ccal-modal-sub">…</small>}
              {!searching &&
                searchedYet &&
                searchResults.length === 0 &&
                searchQuery.trim().length >= MIN_SEARCH_LENGTH && (
                  <small className="ccal-modal-sub">
                    {t("calendar.book_modal.noPatientFound", {
                      defaultValue: "No patients found — try more characters",
                    })}
                  </small>
                )}
              {searchResults.length > 0 && (
                <div className="ccal-search-results">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      className="ccal-search-row"
                      onClick={() => {
                        setSelectedPatient(p);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedPatient(p);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}
                    >
                      <div className="ccal-search-row-name">
                        {[p.firstName, p.lastName].filter(Boolean).join(" ") ||
                          "—"}
                      </div>
                      <div className="ccal-search-row-meta">
                        {[p.phone, p.email].filter(Boolean).join(" · ") || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showCreateButton && (
                <button
                  type="button"
                  className="ccal-btn-secondary"
                  style={{ marginTop: "8px", alignSelf: "flex-start" }}
                  onClick={() => setCreatingPatient(true)}
                >
                  {createButtonLabel()}
                </button>
              )}
            </>
          )}
        </div>

        {/* Department (optional) */}
        {departments.length > 0 && (
          <div className="ccal-field">
            <span>
              {t("calendar.book_modal.department", {
                defaultValue: "Отделение",
              })}
            </span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">
                {t("calendar.book_modal.departmentNone", {
                  defaultValue: "— не указано —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                  {d.code ? ` (${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duration pills */}
        <div className="ccal-field">
          <span>
            {t("calendar.book_modal.duration", { defaultValue: "Duration" })}
          </span>
          <div className="ccal-duration-row">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`ccal-duration-pill ${
                  duration === opt ? "is-active" : ""
                }`}
                onClick={() => setDuration(opt)}
              >
                {opt}{" "}
                {t("calendar.book_modal.minutes", { defaultValue: "min" })}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="ccal-field">
          <span>
            {t("calendar.book_modal.reason", {
              defaultValue: "Reason for visit",
            })}
          </span>
          <textarea
            value={reason}
            maxLength={2000}
            placeholder={t("calendar.book_modal.reasonPlaceholder", {
              defaultValue: "For example: sore throat",
            })}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {errorMsg && <div className="ccal-msg is-err">{errorMsg}</div>}

        <div className="ccal-modal-actions">
          <button
            type="button"
            className="ccal-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("calendar.book_modal.cancel", { defaultValue: "Cancel" })}
          </button>
          <button
            type="button"
            className="ccal-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedPatient}
          >
            {submitting
              ? "…"
              : t("calendar.book_modal.submit", {
                  defaultValue: "Create appointment",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
