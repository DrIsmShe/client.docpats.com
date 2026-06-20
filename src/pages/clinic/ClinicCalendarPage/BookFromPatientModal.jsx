// client/src/pages/clinic/ClinicCalendarPage/BookFromPatientModal.jsx
//
// Second entry-point for booking: opened from ClinicPatientDetailPage.
//
// The patient is known up-front, the doctor/date/slot are not. This is
// the inverse of BookAppointmentModal.
//
// Flow:
//   1. DOCTOR — dropdown of all doctors in the clinic.
//   2. DATE — date picker, default = today.
//   3. SLOT — when doctor + date are both set, fetch listFreeSlots().
//   4. DEPARTMENT — optional dropdown of active clinic departments.
//   5. DURATION — pills 15/30/60/90.
//   6. REASON — optional textarea.
//
// Submit → POST /appointments with the chosen slot's startUTC + duration.
// 409 → "this time is taken" (the slot list is stale).

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  listStaff,
  listFreeSlots,
  createAppointment,
  listDepartments,
} from "../../../api/clinic";

// ─── Constants ──────────────────────────────────────────────────

const DURATION_OPTIONS = [15, 30, 60, 90];

const DOCTOR_ROLES = new Set(["owner", "admin", "doctor"]);

// ─── Helpers ────────────────────────────────────────────────────

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickDefaultDuration(slotDurationMinutes) {
  const n = Number(slotDurationMinutes) || 30;
  if (DURATION_OPTIONS.includes(n)) return n;
  return DURATION_OPTIONS.reduce((best, opt) =>
    Math.abs(opt - n) < Math.abs(best - n) ? opt : best,
  );
}

function staffDisplayName(m) {
  return (
    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
    m.email ||
    m.username ||
    "—"
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function BookFromPatientModal({
  patient, // { _id, firstName, lastName, ... } — required, prefilled
  onClose,
  onCreated,
}) {
  const { t } = useTranslation("clinic");

  // ─── State ───
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayISO());

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [, setSlotMeta] = useState({ slotDurationMinutes: 30 });
  const [selectedSlotIdx, setSelectedSlotIdx] = useState("");

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── Load doctors once ───
  useEffect(() => {
    let cancelled = false;
    setDoctorsLoading(true);
    listStaff()
      .then((res) => {
        if (cancelled) return;
        const filtered = (res.items || []).filter(
          (m) =>
            m.actorType === "user" &&
            DOCTOR_ROLES.has(m.role) &&
            m.actorIsActive !== false,
        );
        setDoctors(filtered);
        setDoctorsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDoctors([]);
        setDoctorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // ─── Load free slots when doctor+date are set ───
  const loadSlots = useCallback(async (dId, iso) => {
    if (!dId || !iso) {
      setSlots([]);
      setSelectedSlotIdx("");
      return;
    }
    setSlotsLoading(true);
    try {
      const res = await listFreeSlots({ doctorId: dId, from: iso, to: iso });
      const dayBlock = (res?.days || []).find((d) => d.date === iso);
      setSlots(dayBlock ? dayBlock.slots : []);
      setSlotMeta({
        slotDurationMinutes: res?.slotDurationMinutes ?? 30,
      });
      setDuration(pickDefaultDuration(res?.slotDurationMinutes));
      setSelectedSlotIdx("");
    } catch {
      setSlots([]);
      setSelectedSlotIdx("");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots(doctorId, date);
  }, [doctorId, date, loadSlots]);

  // ─── Submit ───
  async function handleSubmit() {
    if (!doctorId || !date) return;
    if (selectedSlotIdx === "" || selectedSlotIdx === null) return;
    const slot = slots[Number(selectedSlotIdx)];
    if (!slot) return;

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const startUTC = new Date(slot.startUTC);
      const endUTC = new Date(startUTC.getTime() + duration * 60 * 1000);

      await createAppointment({
        doctorId,
        patientId: patient._id,
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
        loadSlots(doctorId, date);
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

  const patientName =
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    patient.phone ||
    patient.email ||
    "—";

  const title = t("calendar.fromPatient.modalTitle", {
    defaultValue: "Book {{patient}} an appointment",
    patient: patientName,
  });

  return (
    <div
      className="ccal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ccal-modal" role="dialog" aria-modal="true">
        <h3 className="ccal-modal-title">{title}</h3>

        {/* Patient chip (locked, no remove) */}
        <div className="ccal-field">
          <span>
            {t("calendar.book_modal.patient", { defaultValue: "Patient" })}
          </span>
          <div className="ccal-chip">
            <span>{patientName}</span>
          </div>
        </div>

        {/* Doctor picker */}
        <div className="ccal-field">
          <span>
            {t("calendar.fromPatient.doctorLabel", { defaultValue: "Doctor" })}
          </span>
          {doctorsLoading ? (
            <small className="ccal-modal-sub">
              {t("calendar.fromPatient.loadingDoctors", {
                defaultValue: "Loading doctors…",
              })}
            </small>
          ) : doctors.length === 0 ? (
            <small className="ccal-modal-sub">
              {t("calendar.fromPatient.noDoctors", {
                defaultValue: "No doctors in this clinic yet",
              })}
            </small>
          ) : (
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="" disabled>
                {t("calendar.fromPatient.doctorPlaceholder", {
                  defaultValue: "Choose a doctor",
                })}
              </option>
              {doctors.map((d) => (
                <option
                  key={d.userId || d.membershipId}
                  value={d.userId || d._id || d.id}
                >
                  {staffDisplayName(d)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date picker */}
        <div className="ccal-field">
          <span>
            {t("calendar.fromPatient.dateLabel", { defaultValue: "Date" })}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Slot picker */}
        <div className="ccal-field">
          <span>
            {t("calendar.fromPatient.slotLabel", { defaultValue: "Time slot" })}
          </span>
          {!doctorId ? (
            <small className="ccal-modal-sub">
              {t("calendar.fromPatient.doctorPlaceholder", {
                defaultValue: "Choose a doctor",
              })}
            </small>
          ) : slotsLoading ? (
            <small className="ccal-modal-sub">
              {t("calendar.fromPatient.loadingSlots", {
                defaultValue: "Loading slots…",
              })}
            </small>
          ) : slots.length === 0 ? (
            <small className="ccal-modal-sub">
              {t("calendar.fromPatient.noSlots", {
                defaultValue: "No free slots on this date",
              })}
            </small>
          ) : (
            <select
              value={selectedSlotIdx}
              onChange={(e) => setSelectedSlotIdx(e.target.value)}
            >
              <option value="" disabled>
                —
              </option>
              {slots.map((s, idx) => (
                <option key={idx} value={String(idx)}>
                  {minutesToHHMM(s.startMinute)}–{minutesToHHMM(s.endMinute)}
                </option>
              ))}
            </select>
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
            disabled={
              submitting ||
              !doctorId ||
              selectedSlotIdx === "" ||
              selectedSlotIdx === null ||
              slots.length === 0
            }
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
