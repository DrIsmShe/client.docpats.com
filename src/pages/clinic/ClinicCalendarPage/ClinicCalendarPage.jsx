// client/src/pages/clinic/ClinicCalendarPage/ClinicCalendarPage.jsx
//
// Doctor's day calendar РІР‚вЂќ the daily booking workbench for the clinic.
//
// Route: /clinic/staff/:doctorId/calendar
//
// Layout per day (two sections):
//
//   Main timeline РІР‚вЂќ chronological list of the doctor's working time:
//     (a) FREE slot    РІвЂ вЂ™ "Book" button РІвЂ вЂ™ BookAppointmentModal
//     (b) ACTIVE appt  (scheduled | checked_in) РІвЂ вЂ™ patient card + inline
//                       lifecycle buttons + click РІвЂ вЂ™ AppointmentDetailModal
//
//   Day archive (collapsible, only if non-empty) РІР‚вЂќ terminal appts
//     (completed | cancelled | no_show), separated so they don't
//     visually intermix with bookable free slots.
//
// PAST-DATE GUARDS (added 17 May 2026):
//   The calendar lets you navigate to any past day, but the FSM there
//   behaves differently:
//     - Free slot in the past   РІвЂ вЂ™ no Book button. Shows "Past" label
//                                  with a dimmed style.
//     - Active appt in the past РІвЂ вЂ™ flagged as overdue (doctor never
//                                  closed it on the day). Only the
//                                  "closing" lifecycle buttons stay
//                                  visible:
//                                    scheduled  РІвЂ вЂ™ Complete + No-show
//                                    checked_in РІвЂ вЂ™ Complete
//                                  Arrived/Cancel are removed: Arrived
//                                  doesn't make sense yesterday; Cancel
//                                  for past visits should go through
//                                  the detail modal with a written
//                                  cancel reason (more deliberate).
//   Backend FSM stays unchanged (ALLOWED_TRANSITIONS already permits
//   these transitions at any time); this is a UI guard only.
//
//   Today and the future behave as before РІР‚вЂќ all buttons available.
//
// CSS NOTE РІР‚вЂќ three new classes for past-date dimming:
//   .ccal-row-past         (free .ccal-row in the past РІР‚вЂќ dimmed, no Book)
//   .ccal-row-overdue      (booked .ccal-row in the past РІР‚вЂќ accent border)
//   .ccal-past-label       ("Past" text replacing the Book button)
//   .ccal-overdue-badge    ("Overdue" badge next to patient name)
//   .ccal-msg-past         (the banner above the timeline on past days)
// Suggested CSS (append to clinicCalendarPage.css):
//   .ccal-row-past { opacity: .55; }
//   .ccal-row-overdue { border-left: 3px solid var(--warn, #f59e0b); }
//   .ccal-past-label { color: var(--muted, #9ca3af); font-size: 13px;
//     font-style: italic; padding-right: 16px; }
//   .ccal-overdue-badge { display: inline-block; margin-left: 8px;
//     padding: 2px 8px; border-radius: 4px; font-size: 11px;
//     font-weight: 600; background: rgba(245, 158, 11, .12);
//     color: var(--warn, #f59e0b); text-transform: uppercase; }
//   .ccal-msg-past { background: rgba(245, 158, 11, .08);
//     border-left: 3px solid var(--warn, #f59e0b);
//     color: var(--text, #111827); padding: 10px 14px;
//     border-radius: 4px; margin: 12px 0; font-size: 14px; }
//
// Conventions followed (project memory):
//   - never put `t` in useEffect/useCallback deps
//   - every t() call has a defaultValue
//   - no <form> tags
//   - no localStorage / sessionStorage

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";

import {
  listStaff,
  listFreeSlots,
  listAppointmentsForDoctor,
  changeAppointmentStatus,
} from "../../../api/clinic";
import BookAppointmentModal from "./BookAppointmentModal";
import AppointmentDetailModal from "./AppointmentDetailModal";
import "./clinicCalendarPage.css";

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Constants РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚

const WRITE_ROLES = new Set(["owner", "admin", "manager", "receptionist"]);
const ACTIVE_STATUSES = new Set(["scheduled", "checked_in"]);
const TERMINAL_STATUSES = new Set(["completed", "cancelled", "no_show"]);

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Helpers РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚

function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

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

function formatDateLong(iso, lang) {
  if (!iso) return "РІР‚вЂќ";
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

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Split + merge helpers РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚

function splitAppointments(appointments) {
  const active = [];
  const terminal = [];
  for (const a of appointments) {
    if (TERMINAL_STATUSES.has(a.status)) {
      terminal.push(a);
    } else {
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
  return [...terminalAppointments].sort(
    (a, b) => a.startMinute - b.startMinute,
  );
}

// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’
//  MAIN COMPONENT
// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’

export default function ClinicCalendarPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const { dashboardPath } = useClinicZone();
  const { t, i18n } = useTranslation("clinic");

  const myRole = layoutContext?.role || "member";
  const canWrite = WRITE_ROLES.has(myRole);

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

  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState(null);

  const [bookSlot, setBookSlot] = useState(null);
  const [detailId, setDetailId] = useState(null);

  // String compare on YYYY-MM-DD is sound РІР‚вЂќ both sides use toISODate in
  // the BROWSER's tz. Recompute on every render so a long-lived tab
  // doesn't get stuck thinking yesterday is "today".
  const isPast = useMemo(() => date < todayISO(), [date]);

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

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

  function goPrev() {
    setDate((d) => shiftISO(d, -1));
  }
  function goNext() {
    setDate((d) => shiftISO(d, 1));
  }
  function goToday() {
    setDate(todayISO());
  }

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
            defaultValue: "Action failed РІР‚вЂќ try again",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [appointmentId]: false }));
    }
  }

  function handleBookOpen(slot) {
    if (!canWrite) return;
    if (isPast) return; // defensive РІР‚вЂќ the Book button is also hidden
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

  if (loading && timeline.length === 0 && archive.length === 0) {
    return (
      <div className="ccal-loading">
        <div className="ccal-spinner" />
      </div>
    );
  }

  return (
    <div className="ccal-page">
      <div className="ccal-header">
        <Link to={dashboardPath} className="ccal-back">
          {t("calendar.back", { defaultValue: "РІвЂ С’ Back to team" })}
        </Link>
        <h1 className="ccal-title">
          {t("calendar.title", { defaultValue: "Calendar" })}
        </h1>
        {doctorName && <p className="ccal-doctor-name">{doctorName}</p>}
      </div>

      <div className="ccal-datenav">
        <button
          type="button"
          className="ccal-btn-secondary"
          onClick={goPrev}
          aria-label={t("calendar.prevDay", { defaultValue: "Previous day" })}
        >
          РІвЂ”Р‚
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
          РІвЂ“В¶
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

      {/* Past-date banner РІР‚вЂќ soft signal that this view is read-mostly */}
      {isPast && (
        <div className="ccal-msg ccal-msg-past">
          {t("calendar.pastDateBanner", {
            defaultValue:
              "Past date РІР‚вЂќ booking is disabled. You can still close open appointments.",
          })}
        </div>
      )}

      {error && <div className="ccal-msg is-err">{error}</div>}
      {actionError && <div className="ccal-msg is-err">{actionError}</div>}

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
              isPast={isPast}
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
            <span className="ccal-archive-chevron">РІвЂ“В¶</span>
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

// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’
//  TimelineRow РІР‚вЂќ one row in the main timeline (free or active appt)
// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’

function TimelineRow({
  item,
  canWrite,
  isPast,
  t,
  isLoading,
  onBook,
  onOpenDetail,
  onQuickStatus,
}) {
  const timeRange = `${minutesToHHMM(item.startMinute)}РІР‚вЂњ${minutesToHHMM(
    item.endMinute,
  )}`;

  if (item.kind === "free") {
    // Past free slot РІвЂ вЂ™ dim + no Book button, just a "past" label.
    if (isPast) {
      return (
        <div className="ccal-row ccal-row-free ccal-row-past">
          <div className="ccal-row-time">{timeRange}</div>
          <div className="ccal-row-body">
            <span className="ccal-free-label">
              {t("calendar.freeSlot", { defaultValue: "Free slot" })}
            </span>
          </div>
          <div className="ccal-row-actions">
            <span className="ccal-past-label">
              {t("calendar.pastSlot", { defaultValue: "Past" })}
            </span>
          </div>
        </div>
      );
    }

    // Today / future free slot РІвЂ вЂ™ Book button (write role only).
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
        isPast ? "ccal-row-overdue" : ""
      } ${isLoading ? "is-loading" : ""}`}
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
          {isPast && (
            <span className="ccal-overdue-badge">
              {t("calendar.overdueLabel", { defaultValue: "Overdue" })}
            </span>
          )}
        </div>
        {appt.reason && <div className="ccal-booked-reason">{appt.reason}</div>}
      </div>
      {canWrite && (
        <div className="ccal-row-actions ccal-row-actions-stack">
          <QuickActions
            status={appt.status}
            isPast={isPast}
            isLoading={isLoading}
            t={t}
            onAction={onQuickStatus}
          />
        </div>
      )}
    </div>
  );
}

// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’
//  TerminalRow РІР‚вЂќ one row in the day archive (terminal status only)
// РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’РІвЂўС’

function TerminalRow({ appt, t, onOpenDetail }) {
  const timeRange = `${minutesToHHMM(appt.startMinute)}РІР‚вЂњ${minutesToHHMM(
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

// РІвЂќР‚РІвЂќР‚РІвЂќР‚ Quick action buttons per status РІвЂќР‚РІвЂќР‚РІвЂќР‚
//
// Mirrors the backend FSM (ALLOWED_TRANSITIONS):
//   scheduled   РІвЂ вЂ™ checked_in, cancelled, no_show
//   checked_in  РІвЂ вЂ™ completed, cancelled, no_show
// Terminal statuses have no inline buttons.
//
// PAST-DATE behaviour (isPast=true):
//   - scheduled  РІвЂ вЂ™ only Complete + No-show
//                  (Arrived doesn't make sense yesterday;
//                   Cancel goes through detail modal with a reason)
//   - checked_in РІвЂ вЂ™ only Complete
//                  (close-out for a forgotten visit)

function QuickActions({ status, isPast, isLoading, t, onAction }) {
  if (status === "scheduled") {
    if (isPast) {
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
            title={t("calendar.action.completeOverdueHint", {
              defaultValue: "Close this overdue visit",
            })}
          >
            {t("calendar.action.complete", { defaultValue: "Complete" })}
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
        </>
      );
    }
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
    if (isPast) {
      return (
        <button
          type="button"
          className="ccal-btn-mini ccal-btn-mini-go"
          onClick={(e) => {
            e.stopPropagation();
            onAction("completed");
          }}
          disabled={isLoading}
          title={t("calendar.action.completeOverdueHint", {
            defaultValue: "Close this overdue visit",
          })}
        >
          {t("calendar.action.complete", { defaultValue: "Complete" })}
        </button>
      );
    }
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
  return null;
}
