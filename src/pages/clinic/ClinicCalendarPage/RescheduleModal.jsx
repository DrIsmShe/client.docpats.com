// client/src/pages/clinic/ClinicCalendarPage/RescheduleModal.jsx
//
// Sub-modal opened from AppointmentDetailModal: lets the user pick a new
// date + slot for an existing appointment without changing duration or
// patient.
//
// Behaviour:
//   - Date picker defaults to the appointment's current localDate.
//   - On date change, fetch listFreeSlots() for that day. The current
//     appointment's own slot doesn't appear in /slots-free (it's taken
//     by itself), but the backend's reschedule endpoint excludes the
//     appointment from its own conflict check, so it's still a valid
//     reschedule target if the user picks something else.
//   - Slot dropdown shows free slots. The user picks one; we keep the
//     existing duration (endUTC - startUTC).
//   - Submit → PATCH /appointments/:id/reschedule.
//     409 → "this time is already taken" message.
//
// Conventions: same as the other modals.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { listFreeSlots, rescheduleAppointment } from "../../../api/clinic";

// ─── Helpers ──────────────────────────────────────────────────

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function durationMs(appt) {
  if (!appt?.startUTC || !appt?.endUTC) return 30 * 60 * 1000;
  return new Date(appt.endUTC).getTime() - new Date(appt.startUTC).getTime();
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function RescheduleModal({
  appointment,
  onClose,
  onRescheduled,
}) {
  const { t } = useTranslation("clinic");

  // ─── State ───
  const [date, setDate] = useState(appointment.localDate);
  const [slots, setSlots] = useState([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── Load free slots for the chosen date ───
  const loadSlotsForDate = useCallback(
    async (iso) => {
      setLoadingSlots(true);
      setErrorMsg(null);
      try {
        const res = await listFreeSlots({
          doctorId: appointment.doctorId,
          from: iso,
          to: iso,
        });
        const dayBlock = (res?.days || []).find((d) => d.date === iso);
        setSlots(dayBlock ? dayBlock.slots : []);
        setSelectedSlotIdx("");
      } catch (err) {
        setSlots([]);
        setSelectedSlotIdx("");
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.reschedule_modal.rescheduleError", {
              defaultValue: "Failed to reschedule the appointment",
            }),
        );
      } finally {
        setLoadingSlots(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [appointment.doctorId],
  );

  useEffect(() => {
    if (date) loadSlotsForDate(date);
  }, [date, loadSlotsForDate]);

  // ─── Submit ───
  async function handleSubmit() {
    if (selectedSlotIdx === "" || selectedSlotIdx === null) return;
    const slot = slots[Number(selectedSlotIdx)];
    if (!slot) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const newStartUTC = new Date(slot.startUTC);
      const newEndUTC = new Date(
        newStartUTC.getTime() + durationMs(appointment),
      );

      await rescheduleAppointment(appointment.id, {
        startUTC: newStartUTC.toISOString(),
        endUTC: newEndUTC.toISOString(),
      });
      onRescheduled();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.reschedule_modal.conflictError", {
              defaultValue: "The chosen time is already taken",
            }),
        );
      } else {
        setErrorMsg(
          err.response?.data?.error ||
            t("calendar.reschedule_modal.rescheduleError", {
              defaultValue: "Failed to reschedule the appointment",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───
  const currentTimeLabel = `${appointment.localDate} · ${minutesToHHMM(
    appointment.startMinute,
  )}–${minutesToHHMM(appointment.endMinute)}`;

  const subtitle = t("calendar.reschedule_modal.subtitle", {
    defaultValue: "Currently: {{time}}",
    time: currentTimeLabel,
  });

  return (
    <div
      className="ccal-modal-overlay"
      onClick={(e) => {
        // Close ONLY on direct clicks on the backdrop. Without this guard,
        // a click on a button inside the modal could close the modal if
        // the button was removed from the DOM between click and bubble
        // (e.g. our inline-create form unmounts on success). Comparing
        // target === currentTarget is the standard, race-proof pattern.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ccal-modal" role="dialog" aria-modal="true">
        <h3 className="ccal-modal-title">
          {t("calendar.reschedule_modal.title", {
            defaultValue: "Reschedule appointment",
          })}
        </h3>
        <p className="ccal-modal-sub">{subtitle}</p>

        {/* Date picker */}
        <div className="ccal-field">
          <span>
            {t("calendar.reschedule_modal.newDate", {
              defaultValue: "New date",
            })}
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
            {t("calendar.reschedule_modal.newSlot", {
              defaultValue: "New slot",
            })}
          </span>
          {loadingSlots ? (
            <small className="ccal-modal-sub">
              {t("calendar.reschedule_modal.loadingSlots", {
                defaultValue: "Loading free slots…",
              })}
            </small>
          ) : slots.length === 0 ? (
            <small className="ccal-modal-sub">
              {t("calendar.reschedule_modal.noFreeSlots", {
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

        {errorMsg && <div className="ccal-msg is-err">{errorMsg}</div>}

        <div className="ccal-modal-actions">
          <button
            type="button"
            className="ccal-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("calendar.reschedule_modal.cancel", {
              defaultValue: "Cancel",
            })}
          </button>
          <button
            type="button"
            className="ccal-btn-primary"
            onClick={handleSubmit}
            disabled={
              submitting ||
              selectedSlotIdx === "" ||
              selectedSlotIdx === null ||
              slots.length === 0
            }
          >
            {submitting
              ? "…"
              : t("calendar.reschedule_modal.submit", {
                  defaultValue: "Reschedule",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
