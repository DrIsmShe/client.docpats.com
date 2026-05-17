// client/src/pages/clinic/ClinicCalendarPage/ClinicCalendarPage.jsx
//
// Doctor's day calendar — the daily booking workbench for the clinic.
//
// Route: /clinic/staff/:doctorId/calendar
//   Visible to all clinic roles (read).
//   Booking & lifecycle actions are gated by role on the BACKEND; the
//   frontend just hides buttons when canWrite is false.
//
// Layout per day (two sections):
//
//   Main timeline — chronological list of the doctor's working time:
//     (a) FREE slot    → "Book" button → BookAppointmentModal
//     (b) ACTIVE appt  (scheduled | checked_in) → patient card + inline
//                       lifecycle buttons + click → AppointmentDetailModal
//
//   Day archive (collapsible, only rendered if non-empty) — terminal
//   appointments of that same day, separated so they don't visually
//   intermix with bookable free slots:
//     completed | cancelled | no_show
//   Still clickable to open the detail modal (for reason edits etc.),
//   just no inline action buttons because the FSM is terminal.
//
//   Why the split: terminal appointments occupy real wall-clock slots,
//   but those slots are FREE again for booking (the backend's
//   listFreeSlots correctly returns them as free). Putting them in
//   the same chronological list created a confusing "is this taken or
//   free?" UX — there'd be a 10:00 free slot AND a 10:00 cancelled
//   card right next to each other. The archive section keeps the
//   audit trail visible without that confusion.
//
// Data sources (composed at render time):
//   - listFreeSlots({ doctorId, from, to })           — schedule MINUS booked
//   - listAppointmentsForDoctor({ doctorId, from, to }) — the booked ones
//   We split appointments by status: ACTIVE_STATUSES go into the main
//   timeline (merged with free slots and sorted by startMinute),
//   TERMINAL_STATUSES go into the archive section.
//
// Why two queries: the bookable-slots endpoint hides slots that are
// already taken by ACTIVE appointments. So we fetch both and merge.
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
//
// CSS NOTE — this file references three classes that are NEW for the
// archive section:
//   .ccal-archive          (container)
//   .ccal-archive-header   (clickable header with chevron + count)
//   .ccal-archive-body     (collapsed/expanded list)
//   .ccal-row-terminal     (modifier on .ccal-row for visual dimming)
// Suggested minimal CSS (add to clinicCalendarPage.css):
//   .ccal-archive { margin-top: 24px; border-top: 1px solid var(--border, #e5e7eb); padding-top: 16px; }
//   .ccal-archive-header { display: flex; align-items: center; gap: 8px;
//     cursor: pointer; user-select: none; padding: 8px 0;
//     color: var(--muted, #6b7280); font-weight: 500; }
//   .ccal-archive-header:hover { color: var(--text, #111827); }
//   .ccal-archive-chevron { transition: transform .15s; }
//   .ccal-archive.is-open .ccal-archive-chevron { transform: rotate(90deg); }
//   .ccal-archive-body { display: none; }
//   .ccal-archive.is-open .ccal-archive-body { display: block; }
//   .ccal-row-terminal { opacity: .65; }

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
// These appear in the main timeline merged with free slots.
const ACTIVE_STATUSES = new Set(["scheduled", "checked_in"]);

// Terminal statuses — go to the "Day archive" section, not the main timeline.
// Order matters for readability inside the archive (most-recent action first).
const TERMINAL_STATUSES = new Set(["completed", "cancelled", "no_show"]);

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

// ─── Split + merge helpers ─────────────────────────────────────
//
// We partition appointments into:
//   - active   → go into main timeline (merged with free slots)
//   - terminal → go into archive section
//
// Free slots only ever appear in the main timeline.

function splitAppointments(appointments) {
  const active = [];
  const terminal = [];
  for (const a of appointments) {
    if (TERMINAL_STATUSES.has(a.status)) {
      terminal.push(a);
    } else {
      // scheduled / checked_in / any unknown → treat as active so they're
      // visible (defensive: better to show than to hide if a new status
      // gets added on the backend).
      active.push(a);
    }
  }
  return { active, terminal };
}

function buildMainTimeline(freeSlots, activeAppointments) {
  const items = [];
  for (const slot of freeSlots) {
    items.push({
      kind: "free",
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      payload: slot,
    });
  }
  for (const appt of activeAppointments) {
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

function buildArchive(terminalAppointments) {
  // Sort by startMinute ascending (mirror the main timeline ordering).
  // We don't try to reflect "when the status changed" — backend doesn't
  // expose status-change timestamps in the list payload yet.
  return [...terminalAppointments].sort(
    (a, b) => a.startMinute - b.startMinute,
  );
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
  const [archive, setArchive] = useState([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
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

        // Split appointments by status: active → timeline, terminal → archive.
        const { active, terminal } = splitAppointments(appointments);

        setSlotMeta({
          slotDurationMinutes: freeRes?.slotDurationMinutes ?? 30,
          bufferMinutes: freeRes?.bufferMinutes ?? 0,
          timezone: freeRes?.timezone ?? "Asia/Baku",
        });
        setTimeline(buildMainTimeline(freeSlots, active));
        setArchive(buildArchive(terminal));
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
        setArchive([]);
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
  if (loading && timeline.length === 0 && archive.length === 0) {
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

      {/* Main timeline — free slots + active appointments only */}
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

      {/* Day archive — terminal appointments (collapsed by default).
          Only rendered when there's something to show, so a clean day
          has no extra UI clutter. */}
      {!loading && archive.length > 0 && (
        <div className={`ccal-archive ${archiveOpen ? "is-open" : ""}`}>
          <div
            className="ccal-archive-header"
            onClick={() => setArchiveOpen((o) => !o)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setArchiveOpen((o) => !o);
              }
            }}
          >
            <span className="ccal-archive-chevron">▶</span>
            <span>
              {t("calendar.archive.title", {
                defaultValue: "Day archive",
              })}
            </span>
            <span className="ccal-archive-count">({archive.length})</span>
          </div>
          <div className="ccal-archive-body">
            {archive.map((appt) => (
              <TerminalRow
                key={`archive-${appt.id}`}
                appt={appt}
                t={t}
                onOpenDetail={() => handleDetailOpen(appt)}
              />
            ))}
          </div>
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
//  TimelineRow — one row in the main timeline (free or active appt)
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

  // booked & active (scheduled | checked_in)
  const appt = item.payload;
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

// ════════════════════════════════════════════════════════════════
//  TerminalRow — one row in the day archive (terminal status only)
// ════════════════════════════════════════════════════════════════
//
// Same visual shape as a booked TimelineRow, but:
//   - no inline action buttons (FSM is terminal)
//   - dimmed via .ccal-row-terminal modifier
//   - click still opens the detail modal so the operator can edit
//     reason/notes or review what happened.

function TerminalRow({ appt, t, onOpenDetail }) {
  const timeRange = `${minutesToHHMM(appt.startMinute)}–${minutesToHHMM(
    appt.endMinute,
  )}`;
  return (
    <div
      className={`ccal-row ccal-row-booked ccal-row-terminal status-${appt.status}`}
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
// Terminal statuses have no inline buttons — they live in the archive
// section and only open the detail modal.

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
  // terminal — never rendered (TerminalRow doesn't include QuickActions)
  return null;
}
