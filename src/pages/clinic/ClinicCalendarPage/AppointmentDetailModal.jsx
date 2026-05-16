// client/src/pages/clinic/ClinicCalendarPage/AppointmentDetailModal.jsx
//
// Modal that shows full details of one appointment + every action the
// current user can perform on it.
//
// Opened by clicking a booked-slot card in ClinicCalendarPage.
//
// Layout (vertical):
//   1. Title + close
//   2. Detail rows: patient, doctor, time, duration, reason, status
//      + per-status timestamps (created, checked in, completed, cancelled,
//      no-show) and cancelReason if present
//   3. Reason editor (inline expandable section) — works on ANY status,
//      including terminal ones. Useful for correcting typos on completed
//      appointments without touching their lifecycle state.
//   4. Lifecycle actions grid — buttons for every legal FSM transition
//      from the current status. Terminal statuses show no action buttons
//      (still let the reason editor work).
//   5. Reschedule button — opens RescheduleModal on top.
//
// Read-only viewers (canWrite=false, e.g. nurse) see all detail rows but
// no edit/action UI.
//
// Conventions:
//   - no <form>, no localStorage
//   - t() with defaultValue everywhere; t never in hook deps
//   - re-fetches after every successful action so stale state never
//     lingers (cheaper than threading optimistic updates through the
//     parent, and the parent reloads too on close)

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getAppointment,
  changeAppointmentStatus,
  updateAppointmentReason,
} from "../../../api/clinic";
import RescheduleModal from "./RescheduleModal";

// ─── Constants ─────────────────────────────────────────────────

// Mirror of the backend FSM (ALLOWED_TRANSITIONS). Used to drive the
// action grid — only legal transitions are rendered as buttons.
const ALLOWED_TRANSITIONS = {
  scheduled: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

// Statuses where rescheduling is legal (mirrors backend's RESCHEDULABLE_STATUSES).
const RESCHEDULABLE_STATUSES = new Set(["scheduled", "checked_in"]);

// Variant for the lifecycle button — semantic colour. Maps to CSS classes.
const STATUS_BUTTON_VARIANT = {
  checked_in: "go", // green
  completed: "go", // green
  cancelled: "danger", // red
  no_show: "warn", // amber
};

// ─── Helpers ──────────────────────────────────────────────────

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatDateTime(iso, lang) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(lang || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function durationMinutes(appt) {
  if (!appt) return 0;
  if (
    typeof appt.startMinute === "number" &&
    typeof appt.endMinute === "number"
  ) {
    return appt.endMinute - appt.startMinute;
  }
  if (appt.startUTC && appt.endUTC) {
    return Math.round(
      (new Date(appt.endUTC).getTime() - new Date(appt.startUTC).getTime()) /
        60000,
    );
  }
  return 0;
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function AppointmentDetailModal({
  appointmentId,
  canWrite,
  onClose,
  onChanged,
}) {
  const { t, i18n } = useTranslation("clinic");

  // ─── State ───
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Reason editor
  const [editingReason, setEditingReason] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [reasonSaving, setReasonSaving] = useState(false);
  const [reasonMsg, setReasonMsg] = useState(null);

  // Reschedule sub-modal
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // ─── Load ───
  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAppointment(appointmentId);
      setAppt(res.appointment);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          t("calendar.detail_modal.loadError", {
            defaultValue: "Failed to load the appointment",
          }),
      );
      setAppt(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Actions ───
  async function handleStatusChange(newStatus) {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await changeAppointmentStatus(appointmentId, { status: newStatus });
      // Refresh in place so the user sees the new timestamps without
      // closing the modal.
      await load();
      // Tell parent calendar to refresh its list when the modal closes.
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          t("calendar.detail_modal.statusError", {
            defaultValue: "Failed to change status",
          }),
      );
    } finally {
      setActionLoading(false);
    }
  }

  function openReasonEditor() {
    setReasonDraft(appt?.reason || "");
    setEditingReason(true);
    setReasonMsg(null);
  }

  async function saveReason() {
    setReasonSaving(true);
    setReasonMsg(null);
    try {
      const trimmed = reasonDraft.trim();
      await updateAppointmentReason(appointmentId, {
        reason: trimmed.length === 0 ? null : trimmed,
      });
      await load();
      setEditingReason(false);
      setReasonMsg({
        kind: "ok",
        text: t("calendar.detail_modal.reasonSaved", {
          defaultValue: "Reason saved",
        }),
      });
    } catch (err) {
      setReasonMsg({
        kind: "err",
        text:
          err.response?.data?.error ||
          t("calendar.detail_modal.reasonError", {
            defaultValue: "Failed to save the reason",
          }),
      });
    } finally {
      setReasonSaving(false);
    }
  }

  // ─── Reschedule sub-modal callbacks ───
  function handleRescheduled() {
    setRescheduleOpen(false);
    load();
  }

  // ─── Close (signals parent to refresh) ───
  function handleClose() {
    onClose();
    if (onChanged) onChanged();
  }

  // ─── Render ───
  if (loading && !appt) {
    return (
      <div
        className="ccal-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="ccal-modal" role="dialog" aria-modal="true">
          <div className="ccal-list-loading">
            <div className="ccal-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!appt) {
    return (
      <div
        className="ccal-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="ccal-modal" role="dialog" aria-modal="true">
          <h3 className="ccal-modal-title">
            {t("calendar.detail_modal.title", {
              defaultValue: "Appointment",
            })}
          </h3>
          {errorMsg && <div className="ccal-msg is-err">{errorMsg}</div>}
          <div className="ccal-modal-actions">
            <button
              type="button"
              className="ccal-btn-secondary"
              onClick={handleClose}
            >
              {t("calendar.detail_modal.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeRange = `${minutesToHHMM(appt.startMinute)}–${minutesToHHMM(
    appt.endMinute,
  )}`;
  const legalNext = ALLOWED_TRANSITIONS[appt.status] || [];
  const canReschedule = canWrite && RESCHEDULABLE_STATUSES.has(appt.status);

  return (
    <>
      <div
        className="ccal-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="ccal-modal" role="dialog" aria-modal="true">
          <h3 className="ccal-modal-title">
            {t("calendar.detail_modal.title", {
              defaultValue: "Appointment",
            })}
          </h3>

          {/* ─── Detail rows ─── */}
          <div>
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.patient", {
                  defaultValue: "Patient",
                })}
              </span>
              <span className="ccal-detail-val">
                {appt.patientName ||
                  t("calendar.patientPlaceholder", {
                    defaultValue: "Patient",
                  })}
              </span>
            </div>
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.time", {
                  defaultValue: "Time",
                })}
              </span>
              <span className="ccal-detail-val">
                {appt.localDate} · {timeRange}
              </span>
            </div>
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.duration", {
                  defaultValue: "Duration",
                })}
              </span>
              <span className="ccal-detail-val">
                {durationMinutes(appt)}{" "}
                {t("calendar.book_modal.minutes", {
                  defaultValue: "min",
                })}
              </span>
            </div>
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.status", {
                  defaultValue: "Status",
                })}
              </span>
              <span className="ccal-detail-val">
                <span className={`ccal-badge ccal-badge-${appt.status}`}>
                  {t(`calendar.status.${appt.status}`, {
                    defaultValue: appt.status,
                  })}
                </span>
              </span>
            </div>
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.reason", {
                  defaultValue: "Reason",
                })}
              </span>
              <span
                className="ccal-detail-val"
                style={{ whiteSpace: "pre-line" }}
              >
                {appt.reason ||
                  t("calendar.detail_modal.reasonEmpty", {
                    defaultValue: "not specified",
                  })}
              </span>
            </div>

            {/* Lifecycle timestamps */}
            <div className="ccal-detail-row">
              <span className="ccal-detail-key">
                {t("calendar.detail_modal.createdAt", {
                  defaultValue: "Created",
                })}
              </span>
              <span className="ccal-detail-val">
                {formatDateTime(appt.createdAt, i18n.language)}
              </span>
            </div>
            {appt.checkedInAt && (
              <div className="ccal-detail-row">
                <span className="ccal-detail-key">
                  {t("calendar.detail_modal.checkedInAt", {
                    defaultValue: "Arrived",
                  })}
                </span>
                <span className="ccal-detail-val">
                  {formatDateTime(appt.checkedInAt, i18n.language)}
                </span>
              </div>
            )}
            {appt.completedAt && (
              <div className="ccal-detail-row">
                <span className="ccal-detail-key">
                  {t("calendar.detail_modal.completedAt", {
                    defaultValue: "Completed",
                  })}
                </span>
                <span className="ccal-detail-val">
                  {formatDateTime(appt.completedAt, i18n.language)}
                </span>
              </div>
            )}
            {appt.cancelledAt && (
              <>
                <div className="ccal-detail-row">
                  <span className="ccal-detail-key">
                    {t("calendar.detail_modal.cancelledAt", {
                      defaultValue: "Cancelled",
                    })}
                  </span>
                  <span className="ccal-detail-val">
                    {formatDateTime(appt.cancelledAt, i18n.language)}
                  </span>
                </div>
                {appt.cancelReason && (
                  <div className="ccal-detail-row">
                    <span className="ccal-detail-key">
                      {t("calendar.detail_modal.cancelReason", {
                        defaultValue: "Cancellation reason",
                      })}
                    </span>
                    <span className="ccal-detail-val">{appt.cancelReason}</span>
                  </div>
                )}
              </>
            )}
            {appt.noShowAt && (
              <div className="ccal-detail-row">
                <span className="ccal-detail-key">
                  {t("calendar.detail_modal.noShowAt", {
                    defaultValue: "Marked no-show",
                  })}
                </span>
                <span className="ccal-detail-val">
                  {formatDateTime(appt.noShowAt, i18n.language)}
                </span>
              </div>
            )}
          </div>

          {errorMsg && <div className="ccal-msg is-err">{errorMsg}</div>}
          {reasonMsg && (
            <div
              className={`ccal-msg ${
                reasonMsg.kind === "ok" ? "is-ok" : "is-err"
              }`}
            >
              {reasonMsg.text}
            </div>
          )}

          {/* ─── Reason editor ─── */}
          {canWrite && !editingReason && (
            <div className="ccal-detail-section">
              <button
                type="button"
                className="ccal-btn-secondary"
                onClick={openReasonEditor}
              >
                {t("calendar.detail_modal.actionReason", {
                  defaultValue: "Edit reason",
                })}
              </button>
            </div>
          )}

          {canWrite && editingReason && (
            <div className="ccal-detail-section">
              <h4>
                {t("calendar.detail_modal.newReason", {
                  defaultValue: "New reason",
                })}
              </h4>
              <div className="ccal-field">
                <textarea
                  value={reasonDraft}
                  maxLength={2000}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ccal-modal-actions" style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className="ccal-btn-secondary"
                  onClick={() => {
                    setEditingReason(false);
                    setReasonDraft("");
                  }}
                  disabled={reasonSaving}
                >
                  {t("calendar.book_modal.cancel", {
                    defaultValue: "Cancel",
                  })}
                </button>
                <button
                  type="button"
                  className="ccal-btn-primary"
                  onClick={saveReason}
                  disabled={reasonSaving}
                >
                  {reasonSaving
                    ? "…"
                    : t("calendar.detail_modal.saveReason", {
                        defaultValue: "Save reason",
                      })}
                </button>
              </div>
            </div>
          )}

          {/* ─── Lifecycle actions ─── */}
          {canWrite && legalNext.length > 0 && (
            <div className="ccal-detail-section">
              <h4>
                {t("calendar.detail_modal.actions", {
                  defaultValue: "Actions",
                })}
              </h4>
              <div className="ccal-action-grid">
                {legalNext.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`ccal-btn-mini ccal-btn-mini-${STATUS_BUTTON_VARIANT[s] || "go"}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={actionLoading}
                  >
                    {t(`calendar.status.${s}`, { defaultValue: s })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Reschedule ─── */}
          {canReschedule && (
            <div className="ccal-detail-section">
              <button
                type="button"
                className="ccal-btn-secondary"
                onClick={() => setRescheduleOpen(true)}
              >
                {t("calendar.detail_modal.actionReschedule", {
                  defaultValue: "Reschedule",
                })}
              </button>
            </div>
          )}

          {/* ─── Close ─── */}
          <div className="ccal-modal-actions">
            <button
              type="button"
              className="ccal-btn-secondary"
              onClick={handleClose}
            >
              {t("calendar.detail_modal.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      </div>

      {/* Reschedule sub-modal — rendered as a sibling so its overlay
          stacks above this one. */}
      {rescheduleOpen && (
        <RescheduleModal
          appointment={appt}
          onClose={() => setRescheduleOpen(false)}
          onRescheduled={handleRescheduled}
        />
      )}
    </>
  );
}
