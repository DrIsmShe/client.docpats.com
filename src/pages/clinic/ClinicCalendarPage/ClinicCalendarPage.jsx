// client/src/pages/clinic/ClinicCalendarPage/ClinicCalendarPage.jsx
//
// Doctor's day calendar — the daily booking workbench for the clinic.
//
// Route: /clinic/staff/:doctorId/calendar
//   Visible to all clinic roles (read).
//   Booking & lifecycle actions are gated by role on the BACKEND; the
//   frontend just hides buttons when canWrite is false.
//
// Layout per day:
//   - header: doctor name + back link + date navigator (◀ Today ▶ + date picker)
//   - body: a chronological list of slots for the chosen date, where
//     each row is either:
//       (a) a FREE slot   → "Book" button → BookAppointmentModal
//       (b) a BOOKED slot → patient name + status badge + inline
//                            lifecycle buttons + click anywhere on the
//                            card → AppointmentDetailModal
//
// Data sources (composed at render time):
//   - listFreeSlots({ doctorId, from, to })           — schedule MINUS booked
//   - listAppointmentsForDoctor({ doctorId, from, to }) — the booked ones
//   We render free slots from `freeData.days[0].slots` and booked
//   appointments from `appointments` ordered together by startMinute.
//
// Why two queries: the bookable-slots endpoint hides slots that are
// already taken, but we WANT to render those taken slots — as booked
// cards. So we fetch both and merge.
//
// Time display: all times come from the BACKEND already converted to
// clinic-local minutes (startMinute = minutes from local midnight in
// the clinic's tz). We just format HH:MM. No browser-tz math here.
//
// Conventions followed (project memory):
//   - never put `t` in useEffect/useCallback deps (it recreates each render)
//   - every t() call has a defaultValue
//   - no <form> tags — buttons + onClick
//   - no localStorage / sessionStorage

import React, { useCallback, useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  listStaff,
  listFreeSlots,
  listAppointmentsForDoctor,
  changeAppointmentStatus,
} from "../../../api/clinic";
import BookAppointmentModal from "./BookAppointmentModal";
import AppointmentDetailModal from "./AppointmentDetailModal";
import "./clinicCalendarPage.css";

// ─── Constants ─────────────────────────────────────────────────

// Roles that can write (create/move/cancel) — mirrors WRITE_ROLES on the
// backend, used only to hide buttons. Backend enforces the same set.
const WRITE_ROLES = new Set(["owner", "admin", "receptionist"]);

// Statuses that occupy the doctor's time — same as backend's ACTIVE_STATUSES.
const ACTIVE_STATUSES = new Set(["scheduled", "checked_in"]);

// ─── Helpers ───────────────────────────────────────────────────

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Local "YYYY-MM-DD" from a Date in the BROWSER's tz. We use this only
// for the date-navigator state — the actual day-window passed to the
// backend is the same string, which the backend re-interprets in the
// clinic's tz. For the typical case (staff lives where the clinic is)
// they agree; for cross-tz staff they may differ by ±1 day, which is
// fine — the user picks the day they care about and the backend gives
// them that calendar day in clinic-local time.
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayISO() {
  return toISODate(new Date());
}
function shiftISO(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// Pretty-print a "YYYY-MM-DD" in the user's locale. Used in the header.
function formatDateLong(iso, lang) {
  if (!iso) return "—";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(lang || undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Merge helper ──────────────────────────────────────────────
//
// Given { freeSlots: [{startMinute, endMinute, ...}], appointments: [{startMinute, endMinute, ...}] }
// produce a single chronological list of items:
//   { kind: "free" | "booked", startMinute, endMinute, payload }
//
// Both inputs already in clinic-local minutes — no tz math here.

function mergeIntoTimeline(freeSlots, appointments) {
  const items = [];
  for (const slot of freeSlots) {
    items.push({
      kind: "free",
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      payload: slot,
    });
  }
  for (const appt of appointments) {
    // We display ALL appointments in the calendar, including cancelled/
    // no_show/completed — they happened (or were planned to) that day
    // and the user often wants to see the trace. The slot-availability
    // semantics live in `listFreeSlots`; this is just visualization.
    items.push({
      kind: "booked",
      startMinute: appt.startMinute,
      endMinute: appt.endMinute,
      payload: appt,
    });
  }
  items.sort((a, b) => a.startMinute - b.startMinute);
  return items;
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function ClinicCalendarPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const { t, i18n } = useTranslation("clinic");

  const myRole = layoutContext?.role || "member";
  const canWrite = WRITE_ROLES.has(myRole);

  // ─── State ───
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [slotMeta, setSlotMeta] = useState({
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    timezone: "Asia/Baku",
  });

  // action loading map (per appointment id) — for inline lifecycle buttons
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState(null);

  // modals
  const [bookSlot, setBookSlot] = useState(null); // a free slot object, opens BookModal
  const [detailId, setDetailId] = useState(null); // appointment id, opens DetailModal

  // ─── Load doctor name once ───
  useEffect(() => {
    let cancelled = false;
    listStaff()
      .then((res) => {
        if (cancelled) return;
        const match = (res.items || []).find(
          (m) => String(m.userId || m._id || m.id) === String(doctorId),
        );
        if (match) {
          const name =
            [match.firstName, match.lastName].filter(Boolean).join(" ") ||
            match.email ||
            "";
          setDoctorName(name);
        }
      })
      .catch(() => {
        // not fatal — page still works without the name
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  // ─── Load data for the chosen date ───
  const loadDay = useCallback(
    async (iso) => {
      setLoading(true);
      setError(null);
      try {
        const [freeRes, apptRes] = await Promise.all([
          listFreeSlots({ doctorId, from: iso, to: iso }),
          listAppointmentsForDoctor({ doctorId, from: iso, to: iso }),
        ]);

        const dayBlock = (freeRes?.days || []).find((d) => d.date === iso);
        const freeSlots = dayBlock ? dayBlock.slots : [];
        const appointments = apptRes.items || [];

        setSlotMeta({
          slotDurationMinutes: freeRes?.slotDurationMinutes ?? 30,
          bufferMinutes: freeRes?.bufferMinutes ?? 0,
          timezone: freeRes?.timezone ?? "Asia/Baku",
        });
        setTimeline(mergeIntoTimeline(freeSlots, appointments));
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(
          err.response?.data?.error ||
            t("calendar.loadError", {
              defaultValue: "Failed to load the calendar",
            }),
        );
        setTimeline([]);
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [doctorId, navigate],
  );

  useEffect(() => {
    loadDay(date);
  }, [date, loadDay]);

  // ─── Date navigation ───
  function goPrev() {
    setDate((d) => shiftISO(d, -1));
  }
  function goNext() {
    setDate((d) => shiftISO(d, 1));
  }
  function goToday() {
    setDate(todayISO());
  }

  // ─── Quick lifecycle actions (inline on a booked card) ───
  async function handleQuickStatus(appointmentId, status) {
    setActionLoading((p) => ({ ...p, [appointmentId]: true }));
    setActionError(null);
    try {
      await changeAppointmentStatus(appointmentId, { status });
      await loadDay(date);
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
          t("calendar.actionError", {
            defaultValue: "Action failed — try again",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [appointmentId]: false }));
    }
  }

  // ─── Modal callbacks ───
  function handleBookOpen(slot) {
    if (!canWrite) return;
    setBookSlot(slot);
  }
  function handleBookCreated() {
    setBookSlot(null);
    loadDay(date);
  }
  function handleDetailOpen(appt) {
    setDetailId(appt.id);
  }
  function handleDetailChanged() {
    setDetailId(null);
    loadDay(date);
  }

  // ─── Render: loading / error ───
  if (loading && timeline.length === 0) {
    return (
      <div className="ccal-loading">
        <div className="ccal-spinner" />
      </div>
    );
  }

  return (
    <div className="ccal-page">
      {/* Header */}
      <div className="ccal-header">
        <Link to="/clinic/staff" className="ccal-back">
          {t("calendar.back", { defaultValue: "← Back to team" })}
        </Link>
        <h1 className="ccal-title">
          {t("calendar.title", { defaultValue: "Calendar" })}
        </h1>
        {doctorName && <p className="ccal-doctor-name">{doctorName}</p>}
      </div>

      {/* Date navigator */}
      <div className="ccal-datenav">
        <button
          type="button"
          className="ccal-btn-secondary"
          onClick={goPrev}
          aria-label={t("calendar.prevDay", { defaultValue: "Previous day" })}
        >
          ◀
        </button>
        <button type="button" className="ccal-btn-secondary" onClick={goToday}>
          {t("calendar.today", { defaultValue: "Today" })}
        </button>
        <button
          type="button"
          className="ccal-btn-secondary"
          onClick={goNext}
          aria-label={t("calendar.nextDay", { defaultValue: "Next day" })}
        >
          ▶
        </button>
        <input
          type="date"
          className="ccal-datepicker"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="ccal-date-label">
          {formatDateLong(date, i18n.language)}
        </div>
      </div>

      {error && <div className="ccal-msg is-err">{error}</div>}
      {actionError && <div className="ccal-msg is-err">{actionError}</div>}

      {/* Timeline */}
      {loading ? (
        <div className="ccal-list-loading">
          <div className="ccal-spinner" />
        </div>
      ) : timeline.length === 0 ? (
        <div className="ccal-empty">
          {t("calendar.emptyDay", {
            defaultValue: "No working hours and no appointments on this day.",
          })}
        </div>
      ) : (
        <div className="ccal-timeline">
          {timeline.map((item, idx) => (
            <TimelineRow
              key={`${item.kind}-${item.startMinute}-${idx}`}
              item={item}
              canWrite={canWrite}
              t={t}
              isLoading={
                item.kind === "booked" &&
                Boolean(actionLoading[item.payload.id])
              }
              onBook={() => handleBookOpen(item.payload)}
              onOpenDetail={() => handleDetailOpen(item.payload)}
              onQuickStatus={(status) =>
                handleQuickStatus(item.payload.id, status)
              }
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {bookSlot && (
        <BookAppointmentModal
          doctorId={doctorId}
          slot={bookSlot}
          slotDurationMinutes={slotMeta.slotDurationMinutes}
          date={date}
          onClose={() => setBookSlot(null)}
          onCreated={handleBookCreated}
        />
      )}
      {detailId && (
        <AppointmentDetailModal
          appointmentId={detailId}
          canWrite={canWrite}
          onClose={() => setDetailId(null)}
          onChanged={handleDetailChanged}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TimelineRow — one row in the day timeline
// ════════════════════════════════════════════════════════════════

function TimelineRow({
  item,
  canWrite,
  t,
  isLoading,
  onBook,
  onOpenDetail,
  onQuickStatus,
}) {
  const timeRange = `${minutesToHHMM(item.startMinute)}–${minutesToHHMM(
    item.endMinute,
  )}`;

  if (item.kind === "free") {
    return (
      <div className="ccal-row ccal-row-free">
        <div className="ccal-row-time">{timeRange}</div>
        <div className="ccal-row-body">
          <span className="ccal-free-label">
            {t("calendar.freeSlot", { defaultValue: "Free slot" })}
          </span>
        </div>
        {canWrite && (
          <div className="ccal-row-actions">
            <button type="button" className="ccal-btn-primary" onClick={onBook}>
              {t("calendar.book", { defaultValue: "Book" })}
            </button>
          </div>
        )}
      </div>
    );
  }

  // booked
  const appt = item.payload;
  const isActive = ACTIVE_STATUSES.has(appt.status);
  return (
    <div
      className={`ccal-row ccal-row-booked status-${appt.status} ${
        isLoading ? "is-loading" : ""
      }`}
    >
      <div className="ccal-row-time">{timeRange}</div>
      <div
        className="ccal-row-body ccal-row-body-clickable"
        onClick={onOpenDetail}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenDetail();
        }}
      >
        <div className="ccal-booked-main">
          <span className="ccal-patient-name">
            {appt.patientName ||
              t("calendar.patientPlaceholder", {
                defaultValue: "Patient",
              })}
          </span>
          <StatusBadge status={appt.status} t={t} />
        </div>
        {appt.reason && <div className="ccal-booked-reason">{appt.reason}</div>}
      </div>
      {canWrite && (
        <div className="ccal-row-actions ccal-row-actions-stack">
          <QuickActions
            status={appt.status}
            isLoading={isLoading}
            t={t}
            onAction={onQuickStatus}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }) {
  return (
    <span className={`ccal-badge ccal-badge-${status}`}>
      {t(`calendar.status.${status}`, { defaultValue: status })}
    </span>
  );
}

// ─── Quick action buttons per status ───
//
// Mirrors the backend FSM (ALLOWED_TRANSITIONS):
//   scheduled   → checked_in, cancelled, no_show
//   checked_in  → completed, cancelled, no_show
// Terminal statuses have no inline buttons — open the detail modal.

function QuickActions({ status, isLoading, t, onAction }) {
  if (status === "scheduled") {
    return (
      <>
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-go"
          onClick={(e) => {
            e.stopPropagation();
            onAction("checked_in");
          }}
          disabled={isLoading}
        >
          {t("calendar.action.checkIn", { defaultValue: "Arrived" })}
        </button>
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-warn"
          onClick={(e) => {
            e.stopPropagation();
            onAction("no_show");
          }}
          disabled={isLoading}
        >
          {t("calendar.action.noShow", { defaultValue: "No-show" })}
        </button>
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-danger"
          onClick={(e) => {
            e.stopPropagation();
            onAction("cancelled");
          }}
          disabled={isLoading}
        >
          {t("calendar.action.cancel", { defaultValue: "Cancel" })}
        </button>
      </>
    );
  }
  if (status === "checked_in") {
    return (
      <>
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-go"
          onClick={(e) => {
            e.stopPropagation();
            onAction("completed");
          }}
          disabled={isLoading}
        >
          {t("calendar.action.complete", { defaultValue: "Complete" })}
        </button>
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-danger"
          onClick={(e) => {
            e.stopPropagation();
            onAction("cancelled");
          }}
          disabled={isLoading}
        >
          {t("calendar.action.cancel", { defaultValue: "Cancel" })}
        </button>
      </>
    );
  }
  // terminal — no quick actions; the detail modal still works for reason edits
  return null;
}
