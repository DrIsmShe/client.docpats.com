// client/src/pages/clinic/EmployeeBookAppointmentPage/EmployeeBookAppointmentPage.jsx
//
// Employee-zone appointment booking page (receptionist / registrar flow).
//
// Route (to be added in App.jsx employee block):
//   /clinic/employee/book   ->  <EmployeeBookAppointmentPage />
//
// Flow:  pick doctor -> pick date -> pick a free slot -> find patient
//        -> confirm -> POST /appointments.
//
// Data sources (all already in src/api/clinic.js):
//   listStaff()                     -> doctors (filter role === "doctor")
//   listFreeSlots({doctorId,from,to}) -> schedule MINUS booked
//   searchPatients({phone|email|lastName}) -> existing clinic patients
//   createAppointment({doctorId,patientId,startUTC,endUTC,reason?})
//
// Permission gate: appointment.write (receptionist has APPOINTMENT: FULL).
// Uses useClinicPermissions()/can() sourced from the employee Outlet context,
// same mechanism as EmployeeDashboardPage.
//
// ASCII-only source: no Cyrillic literals. All visible copy goes through
// t("booking.*", { defaultValue: "<english>" }); RU/tr/az/ar live in locale
// files (inject via the usual UTF-8 Node script). This keeps esbuild clean
// and dodges the CP1251 mangling that bit the pharmacy page.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";

import { useClinicPermissions } from "../../../lib/can";
import {
  listStaff,
  listFreeSlots,
  searchPatients,
  createAppointment,
} from "../../../api/clinic";

// Roles that can hold a schedule and take appointments. Mirrors
// EmployeeSchedulePage's SCHEDULABLE_ROLES so an owner/admin who also
// practices (e.g. an owner-radiologist) shows up as bookable.
const SCHEDULABLE_ROLES = ["doctor", "owner", "admin"];

// ─── small helpers ─────────────────────────────────────────────

// Local YYYY-MM-DD (NOT toISOString, which shifts to UTC and can roll a day).
function todayLocalISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

// Format a slot's local start time from its startMinute (minutes from midnight).
function minuteToHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// endUTC = startUTC + (endMinute - startMinute) minutes. Exact per-slot length,
// not the schedule default, so custom-length slots book correctly.
function computeEndUTC(slot) {
  const durMin = Math.max(1, (slot.endMinute ?? 0) - (slot.startMinute ?? 0));
  return new Date(
    new Date(slot.startUTC).getTime() + durMin * 60000,
  ).toISOString();
}

function patientLabel(p) {
  const name = [p.lastName, p.firstName].filter(Boolean).join(" ").trim();
  const extra = p.phone || p.email || "";
  return name ? (extra ? `${name} — ${extra}` : name) : extra || p._id || p.id;
}

function doctorLabel(d) {
  const name = [d.lastName, d.firstName].filter(Boolean).join(" ").trim();
  return name || d.email || d.userId || d._id || d.id;
}

// The id the schedule/appointment endpoints key a doctor by. EmployeeSchedulePage
// feeds this same id into /appointments/schedule/:doctorId, so it must match.
// If free slots always come back empty, this is the field to check first.
function doctorIdOf(d) {
  return d.userId || d._id || d.id;
}

// ─── styles (inline, consistent with other employee-zone pages) ─

const S = {
  page: { maxWidth: 920, margin: "0 auto", padding: "32px 20px" },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: "#0f172a" },
  sub: { color: "#64748b", fontSize: 14, marginBottom: 24 },
  row: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6, minWidth: 220 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    letterSpacing: ".02em",
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    background: "#fff",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 12,
    color: "#0f172a",
  },
  slotGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  slot: (active) => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#0f172a",
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
  }),
  patientRow: (active) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 8,
    border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
    background: active ? "#eff6ff" : "#fff",
    cursor: "pointer",
    marginBottom: 6,
  }),
  primaryBtn: (disabled) => ({
    padding: "11px 22px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#94a3b8" : "#2563eb",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  ghostBtn: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
  toast: (kind) => ({
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 600,
    background: kind === "error" ? "#fef2f2" : "#f0fdf4",
    color: kind === "error" ? "#b91c1c" : "#15803d",
    border: `1px solid ${kind === "error" ? "#fecaca" : "#bbf7d0"}`,
  }),
  muted: { color: "#94a3b8", fontSize: 14, padding: "8px 0" },
  gate: { textAlign: "center", padding: "80px 20px", color: "#475569" },
};

// ─── component ─────────────────────────────────────────────────

export default function EmployeeBookAppointmentPage() {
  const { t } = useTranslation();
  const { can } = useClinicPermissions();
  // Outlet context is present in the employee zone; kept for parity / future use.
  useOutletContext();

  const canBook = can("appointment", "write");

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayLocalISO());

  const [slotsData, setSlotsData] = useState(null); // raw /slots-free response
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { kind, text }

  // ── load doctors once ──
  useEffect(() => {
    let alive = true;
    setDoctorsLoading(true);
    listStaff()
      .then((res) => {
        if (!alive) return;
        const docs = (res.items || []).filter((m) =>
          SCHEDULABLE_ROLES.includes(m.role),
        );
        setDoctors(docs);
      })
      .catch(() => {
        if (alive)
          setToast({
            kind: "error",
            text: t("booking.errDoctors", {
              defaultValue: "Could not load the doctor list",
            }),
          });
      })
      .finally(() => alive && setDoctorsLoading(false));
    return () => {
      alive = false;
    };
  }, [t]);

  // ── load free slots when doctor + date chosen ──
  useEffect(() => {
    if (!doctorId || !date) {
      setSlotsData(null);
      setSelectedSlot(null);
      return;
    }
    let alive = true;
    setSlotsLoading(true);
    setSelectedSlot(null);
    listFreeSlots({ doctorId, from: date, to: date })
      .then((data) => {
        if (alive) setSlotsData(data);
      })
      .catch(() => {
        if (alive) {
          setSlotsData(null);
          setToast({
            kind: "error",
            text: t("booking.errSlots", {
              defaultValue: "Could not load free slots for this day",
            }),
          });
        }
      })
      .finally(() => alive && setSlotsLoading(false));
    return () => {
      alive = false;
    };
  }, [doctorId, date, t]);

  const daySlots = useMemo(() => {
    if (!slotsData?.days?.length) return [];
    const day =
      slotsData.days.find((d) => d.date === date) || slotsData.days[0];
    return day?.slots || [];
  }, [slotsData, date]);

  // ── patient search ──
  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setToast(null);
    // Route the single input to the right backend param.
    const params = { limit: 10 };
    if (/^[+\d][\d\s()-]{4,}$/.test(q))
      params.phone = q.replace(/[\s()-]/g, "");
    else if (q.includes("@")) params.email = q;
    else params.lastName = q;
    try {
      const res = await searchPatients(params);
      setPatients(res.items || []);
      if (!(res.items || []).length)
        setToast({
          kind: "error",
          text: t("booking.noPatients", {
            defaultValue: "No matching patients found",
          }),
        });
    } catch {
      setToast({
        kind: "error",
        text: t("booking.errSearch", {
          defaultValue: "Patient search failed",
        }),
      });
    } finally {
      setSearching(false);
    }
  }, [query, t]);

  // ── confirm booking ──
  const submit = useCallback(async () => {
    if (!doctorId || !selectedSlot || !selectedPatient) return;
    setSubmitting(true);
    setToast(null);
    try {
      await createAppointment({
        doctorId,
        patientId: selectedPatient._id || selectedPatient.id,
        startUTC: selectedSlot.startUTC,
        endUTC: computeEndUTC(selectedSlot),
        ...(reason.trim() && { reason: reason.trim() }),
      });
      setToast({
        kind: "success",
        text: t("booking.success", {
          defaultValue: "Patient booked",
        }),
      });
      // Clear the picked slot + patient and refetch so the taken slot disappears.
      setSelectedSlot(null);
      setSelectedPatient(null);
      setReason("");
      setSlotsLoading(true);
      listFreeSlots({ doctorId, from: date, to: date })
        .then((data) => setSlotsData(data))
        .catch(() => {})
        .finally(() => setSlotsLoading(false));
    } catch (err) {
      const status = err?.response?.status;
      setToast({
        kind: "error",
        text:
          status === 409
            ? t("booking.conflict", {
                defaultValue: "That slot was just taken. Pick another.",
              })
            : t("booking.errCreate", {
                defaultValue: "Could not create the appointment",
              }),
      });
      // On conflict, refresh slots so the stale one drops off.
      if (status === 409) {
        listFreeSlots({ doctorId, from: date, to: date })
          .then((data) => setSlotsData(data))
          .catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  }, [doctorId, selectedSlot, selectedPatient, reason, date, t]);

  // ── permission gate ──
  if (!canBook) {
    return (
      <div style={S.gate}>
        {t("booking.noPermission", {
          defaultValue: "You do not have permission to book appointments",
        })}
      </div>
    );
  }

  const canSubmit = doctorId && selectedSlot && selectedPatient && !submitting;

  return (
    <div style={S.page}>
      <h1 style={S.h1}>
        {t("booking.title", { defaultValue: "Book an appointment" })}
      </h1>
      <div style={S.sub}>
        {t("booking.subtitle", {
          defaultValue: "Pick a doctor and a free slot, then find the patient.",
        })}
      </div>

      {toast && <div style={S.toast(toast.kind)}>{toast.text}</div>}

      {/* Doctor + date */}
      <div style={S.row}>
        <div style={S.field}>
          <label style={S.label}>
            {t("booking.doctor", { defaultValue: "Doctor" })}
          </label>
          <select
            style={S.input}
            value={doctorId}
            disabled={doctorsLoading}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">
              {doctorsLoading
                ? t("booking.loading", { defaultValue: "Loading…" })
                : t("booking.selectDoctor", {
                    defaultValue: "Select a doctor",
                  })}
            </option>
            {doctors.map((d) => {
              const id = doctorIdOf(d);
              return (
                <option key={id} value={id}>
                  {doctorLabel(d)}
                </option>
              );
            })}
          </select>
        </div>

        <div style={S.field}>
          <label style={S.label}>
            {t("booking.date", { defaultValue: "Date" })}
          </label>
          <input
            type="date"
            style={S.input}
            value={date}
            min={todayLocalISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Slots */}
      {doctorId && (
        <div style={S.card}>
          <div style={S.sectionTitle}>
            {t("booking.freeSlots", { defaultValue: "Free slots" })}
          </div>
          {slotsLoading ? (
            <div style={S.muted}>
              {t("booking.loading", { defaultValue: "Loading…" })}
            </div>
          ) : daySlots.length === 0 ? (
            <div style={S.muted}>
              {t("booking.noSlots", {
                defaultValue:
                  "No free slots this day. The doctor may not work then, or the day is fully booked.",
              })}
            </div>
          ) : (
            <div style={S.slotGrid}>
              {daySlots.map((slot) => {
                const active =
                  selectedSlot && selectedSlot.startUTC === slot.startUTC;
                return (
                  <button
                    key={slot.startUTC}
                    type="button"
                    style={S.slot(active)}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {minuteToHHMM(slot.startMinute)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Patient search */}
      {selectedSlot && (
        <div style={S.card}>
          <div style={S.sectionTitle}>
            {t("booking.patient", { defaultValue: "Patient" })}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder={t("booking.searchPlaceholder", {
                defaultValue: "Last name, phone, or email",
              })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            <button
              type="button"
              style={S.ghostBtn}
              onClick={runSearch}
              disabled={searching || !query.trim()}
            >
              {searching
                ? t("booking.searching", { defaultValue: "Searching…" })
                : t("booking.searchBtn", { defaultValue: "Search" })}
            </button>
          </div>

          {patients.map((p) => {
            const id = p._id || p.id;
            const active =
              selectedPatient &&
              (selectedPatient._id || selectedPatient.id) === id;
            return (
              <div
                key={id}
                style={S.patientRow(active)}
                onClick={() => setSelectedPatient(p)}
              >
                <span>{patientLabel(p)}</span>
                {active && (
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm */}
      {selectedSlot && selectedPatient && (
        <div style={S.card}>
          <div style={S.field}>
            <label style={S.label}>
              {t("booking.reason", {
                defaultValue: "Reason / note (optional)",
              })}
            </label>
            <input
              style={S.input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("booking.reasonPlaceholder", {
                defaultValue: "e.g. follow-up, consultation",
              })}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              style={S.primaryBtn(!canSubmit)}
              onClick={submit}
              disabled={!canSubmit}
            >
              {submitting
                ? t("booking.booking", { defaultValue: "Booking…" })
                : t("booking.confirm", { defaultValue: "Book appointment" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
