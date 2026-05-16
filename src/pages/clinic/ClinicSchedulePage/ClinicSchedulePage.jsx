// client/src/pages/clinic/ClinicSchedulePage/ClinicSchedulePage.jsx
//
// Doctor schedule management page.
//
// Route: /clinic/staff/:doctorId/schedule
//   - owner / admin → can edit any doctor's schedule
//   - a doctor → can edit their own (userId === doctorId)
//   The backend enforces this via assertDoctorOfClinic; the frontend just
//   hides the controls when the viewer can't edit.
//
// Two tabs:
//   "weekly"     — the recurring weekly working-hours pattern
//   "exceptions" — per-date overrides: day-off, vacation range, custom hours
//
// Talks to the day-1 + day-2 backend via src/api/clinic.js:
//   getDoctorSchedule / upsertDoctorSchedule
//   listScheduleExceptions / createScheduleException /
//   bulkCreateDayOff / deleteScheduleException
//
// i18n namespace "clinic" (shared across the whole clinic module), keys
// under "schedule.*". RTL is handled by ClinicLayout (it sets document dir);
// this page only uses logical layout so it flips automatically.
//
// Conventions followed (per project memory):
//   - never put `t` in useEffect/useCallback deps (it recreates each render)
//   - every t() call has a defaultValue
//   - no <form> tags — buttons + onClick
//   - no localStorage / sessionStorage

import React, { useEffect, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getDoctorSchedule,
  upsertDoctorSchedule,
  listScheduleExceptions,
  createScheduleException,
  bulkCreateDayOff,
  deleteScheduleException,
  listStaff,
} from "../../../api/clinic";
import "./clinicSchedulePage.css";

// ─── Constants ────────────────────────────────────────────────

// Display order: Monday first, Sunday last. weekday values follow
// JS Date.getDay() (0 = Sunday) to match the backend.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const EDIT_ROLES = ["owner", "admin"];
const DEFAULT_INTERVAL = { startMinute: 540, endMinute: 1080 }; // 09:00–18:00

// ─── Time helpers ─────────────────────────────────────────────

// minutes-from-midnight -> "HH:MM" for <input type="time">
function minutesToHHMM(min) {
  const m = Math.max(0, Math.min(1440, Number(min) || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// "HH:MM" -> minutes-from-midnight
function hhmmToMinutes(str) {
  if (typeof str !== "string") return 0;
  const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim());
  if (!m) return 0;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  return Math.max(0, Math.min(1440, h * 60 + mm));
}

// ─── Date helpers ─────────────────────────────────────────────

// Local "YYYY-MM-DD" for a Date (uses the browser's local calendar — good
// enough for picking a range; the backend re-interprets in clinic tz).
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayISO() {
  return toISODate(new Date());
}
function monthStartISO() {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function monthEndISO() {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

// Format a stored exception date (UTC ISO string) for display in the user's
// locale. The backend stores clinic-local midnight as UTC; for display we
// just show the calendar date portion.
function formatExceptionDate(isoString, lang) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(lang || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Weekly-pattern validation (client-side mirror of the backend) ──
// Returns null if ok, or a { field } error descriptor.
function validateWeeklyDays(weeklyDays) {
  for (const day of weeklyDays) {
    if (!day.enabled) continue;
    const intervals = day.intervals || [];
    for (const iv of intervals) {
      if (iv.startMinute >= iv.endMinute) {
        return { weekday: day.weekday, kind: "invalid" };
      }
    }
    // overlap check within the day
    const sorted = [...intervals].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMinute < sorted[i - 1].endMinute) {
        return { weekday: day.weekday, kind: "overlap" };
      }
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function ClinicSchedulePage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const { t, i18n } = useTranslation("clinic");

  const myRole = layoutContext?.role || "member";
  const myUserId = layoutContext?.userId || null;
  // owner/admin edit anyone; a doctor edits their own schedule
  const canEdit =
    EDIT_ROLES.includes(myRole) ||
    (myUserId && String(myUserId) === String(doctorId));

  // ─── Page-level state ───
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [activeTab, setActiveTab] = useState("weekly");

  // ─── Weekly-pattern state ───
  // weeklyDays: always 7 entries in WEEKDAY_ORDER, each:
  //   { weekday, enabled, intervals: [{ startMinute, endMinute }] }
  const [weeklyDays, setWeeklyDays] = useState(() =>
    WEEKDAY_ORDER.map((wd) => ({ weekday: wd, enabled: false, intervals: [] })),
  );
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [weeklyMsg, setWeeklyMsg] = useState(null); // { kind: "ok"|"err", text }

  // ─── Exceptions state ───
  const [rangeFrom, setRangeFrom] = useState(monthStartISO());
  const [rangeTo, setRangeTo] = useState(monthEndISO());
  const [exceptions, setExceptions] = useState([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [exceptionsMsg, setExceptionsMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [vacationModalOpen, setVacationModalOpen] = useState(false);

  // ─── Build weeklyDays from a backend schedule object ───
  const applyScheduleToState = useCallback((schedule) => {
    const base = WEEKDAY_ORDER.map((wd) => ({
      weekday: wd,
      enabled: false,
      intervals: [],
    }));
    if (schedule && Array.isArray(schedule.weeklyHours)) {
      for (const dayEntry of schedule.weeklyHours) {
        const slot = base.find((b) => b.weekday === dayEntry.weekday);
        if (slot) {
          slot.enabled = true;
          slot.intervals = (dayEntry.intervals || []).map((iv) => ({
            startMinute: iv.startMinute,
            endMinute: iv.endMinute,
          }));
        }
      }
    }
    setWeeklyDays(base);
    if (schedule) {
      setSlotDuration(schedule.slotDurationMinutes ?? 30);
      setBufferMinutes(schedule.bufferMinutes ?? 0);
      setIsActive(schedule.isActive ?? true);
    }
  }, []);

  // ─── Initial load: schedule + doctor name ───
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getDoctorSchedule(doctorId).catch((err) => {
        // 404 here would be unusual (route is fine); treat as "no schedule"
        if (err.response?.status === 404) return { schedule: null };
        throw err;
      }),
      listStaff().catch(() => ({ items: [] })),
    ])
      .then(([scheduleRes, staffRes]) => {
        if (cancelled) return;
        applyScheduleToState(scheduleRes?.schedule || null);

        const match = (staffRes.items || []).find(
          (m) => String(m.userId || m._id || m.id) === String(doctorId),
        );
        if (match) {
          const name =
            [match.firstName, match.lastName].filter(Boolean).join(" ") ||
            match.email ||
            match.username ||
            "";
          setDoctorName(name);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(
          err.response?.data?.error ||
            t("schedule.loadError", {
              defaultValue: "Failed to load schedule",
            }),
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, applyScheduleToState, navigate]);

  // ─── Load exceptions for the current range ───
  const loadExceptions = useCallback(
    async (from, to) => {
      setLoadingExceptions(true);
      setExceptionsMsg(null);
      try {
        const res = await listScheduleExceptions(doctorId, { from, to });
        setExceptions(res.items || []);
      } catch (err) {
        setExceptionsMsg({
          kind: "err",
          text:
            err.response?.data?.error ||
            t("schedule.loadError", {
              defaultValue: "Failed to load schedule",
            }),
        });
        setExceptions([]);
      } finally {
        setLoadingExceptions(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doctorId],
  );

  // Load exceptions once on mount (default = current month).
  useEffect(() => {
    loadExceptions(monthStartISO(), monthEndISO());
  }, [loadExceptions]);

  // ─── Weekly-day mutations ───
  function toggleDayEnabled(weekday) {
    setWeeklyDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        const enabled = !d.enabled;
        return {
          ...d,
          enabled,
          // turning a day on with no intervals: seed one default interval
          intervals:
            enabled && d.intervals.length === 0
              ? [{ ...DEFAULT_INTERVAL }]
              : d.intervals,
        };
      }),
    );
    setWeeklyMsg(null);
  }

  function addInterval(weekday) {
    setWeeklyDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday
          ? { ...d, intervals: [...d.intervals, { ...DEFAULT_INTERVAL }] }
          : d,
      ),
    );
    setWeeklyMsg(null);
  }

  function removeInterval(weekday, index) {
    setWeeklyDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday
          ? { ...d, intervals: d.intervals.filter((_, i) => i !== index) }
          : d,
      ),
    );
    setWeeklyMsg(null);
  }

  function updateInterval(weekday, index, field, hhmm) {
    const minutes = hhmmToMinutes(hhmm);
    setWeeklyDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        const intervals = d.intervals.map((iv, i) =>
          i === index ? { ...iv, [field]: minutes } : iv,
        );
        return { ...d, intervals };
      }),
    );
    setWeeklyMsg(null);
  }

  // ─── Save the weekly pattern ───
  async function handleSaveWeekly() {
    setWeeklyMsg(null);

    // client-side validation mirrors the backend validator
    const vErr = validateWeeklyDays(weeklyDays);
    if (vErr) {
      const dayName = t(`schedule.weekdays.${vErr.weekday}`, {
        defaultValue: String(vErr.weekday),
      });
      setWeeklyMsg({
        kind: "err",
        text:
          vErr.kind === "overlap"
            ? `${dayName}: ${t("schedule.weekly.overlapError", {
                defaultValue: "Intervals overlap — check the times",
              })}`
            : `${dayName}: ${t("schedule.weekly.invalidInterval", {
                defaultValue: "Start time must be before end time",
              })}`,
      });
      return;
    }

    // build payload: only enabled days that actually have intervals
    const weeklyHours = weeklyDays
      .filter((d) => d.enabled && d.intervals.length > 0)
      .map((d) => ({
        weekday: d.weekday,
        intervals: d.intervals.map((iv) => ({
          startMinute: iv.startMinute,
          endMinute: iv.endMinute,
        })),
      }));

    const payload = {
      weeklyHours,
      slotDurationMinutes: Number(slotDuration) || 30,
      bufferMinutes: Number(bufferMinutes) || 0,
      isActive: Boolean(isActive),
    };

    setSavingWeekly(true);
    try {
      const res = await upsertDoctorSchedule(doctorId, payload);
      applyScheduleToState(res?.schedule || null);
      setWeeklyMsg({
        kind: "ok",
        text: t("schedule.saved", { defaultValue: "Saved" }),
      });
    } catch (err) {
      setWeeklyMsg({
        kind: "err",
        text:
          err.response?.data?.error ||
          t("schedule.saveError", { defaultValue: "Failed to save" }),
      });
    } finally {
      setSavingWeekly(false);
    }
  }

  // ─── Exception mutations ───
  async function handleDeleteException(exceptionId) {
    if (
      !window.confirm(
        t("schedule.exceptions.confirmDelete", {
          defaultValue: "Delete this exception?",
        }),
      )
    ) {
      return;
    }
    setActionLoading((p) => ({ ...p, [exceptionId]: true }));
    try {
      await deleteScheduleException(exceptionId);
      setExceptions((prev) =>
        prev.filter((e) => String(e.id) !== String(exceptionId)),
      );
    } catch (err) {
      setExceptionsMsg({
        kind: "err",
        text:
          err.response?.data?.error ||
          t("schedule.exceptions.deleteError", {
            defaultValue: "Failed to delete exception",
          }),
      });
    } finally {
      setActionLoading((p) => ({ ...p, [exceptionId]: false }));
    }
  }

  function handleSingleCreated() {
    setSingleModalOpen(false);
    loadExceptions(rangeFrom, rangeTo);
  }

  function handleVacationCreated(count) {
    setVacationModalOpen(false);
    setExceptionsMsg({
      kind: "ok",
      text: t("schedule.exceptions.vacationModal.createdCount", {
        count,
        defaultValue: "Days off created: {{count}}",
      }),
    });
    loadExceptions(rangeFrom, rangeTo);
  }

  // ─── Render: loading / error ───
  if (loading) {
    return (
      <div className="csched-loading">
        <div className="csched-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="csched-error">
        <h2>{t("schedule.title", { defaultValue: "Doctor schedule" })}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} type="button">
          {t("schedule.retry", { defaultValue: "Retry" })}
        </button>
      </div>
    );
  }

  // ─── Render: page ───
  return (
    <div className="csched-page">
      {/* Header */}
      <div className="csched-header">
        <Link to="/clinic/staff" className="csched-back">
          {t("schedule.back", { defaultValue: "← Back to team" })}
        </Link>
        <h1 className="csched-title">
          {t("schedule.title", { defaultValue: "Doctor schedule" })}
        </h1>
        {doctorName && <p className="csched-doctor-name">{doctorName}</p>}
      </div>

      {/* Tabs */}
      <div className="csched-tabs">
        <button
          type="button"
          className={`csched-tab ${activeTab === "weekly" ? "is-active" : ""}`}
          onClick={() => setActiveTab("weekly")}
        >
          {t("schedule.weeklyTab", { defaultValue: "Weekly schedule" })}
        </button>
        <button
          type="button"
          className={`csched-tab ${
            activeTab === "exceptions" ? "is-active" : ""
          }`}
          onClick={() => setActiveTab("exceptions")}
        >
          {t("schedule.exceptionsTab", {
            defaultValue: "Exceptions & time off",
          })}
        </button>
      </div>

      {/* ─── WEEKLY TAB ─── */}
      {activeTab === "weekly" && (
        <section className="csched-section">
          <div className="csched-section-head">
            <h2>
              {t("schedule.weekly.title", {
                defaultValue: "Working hours by weekday",
              })}
            </h2>
            <p className="csched-section-sub">
              {t("schedule.weekly.subtitle", {
                defaultValue:
                  "Set the regular schedule. You can add a break as a separate interval.",
              })}
            </p>
          </div>

          <div className="csched-weekdays">
            {weeklyDays.map((day) => (
              <WeekdayRow
                key={day.weekday}
                day={day}
                canEdit={canEdit}
                t={t}
                onToggle={() => toggleDayEnabled(day.weekday)}
                onAddInterval={() => addInterval(day.weekday)}
                onRemoveInterval={(idx) => removeInterval(day.weekday, idx)}
                onUpdateInterval={(idx, field, val) =>
                  updateInterval(day.weekday, idx, field, val)
                }
              />
            ))}
          </div>

          <div className="csched-settings">
            <label className="csched-field">
              <span>
                {t("schedule.weekly.slotDuration", {
                  defaultValue: "Appointment length (min)",
                })}
              </span>
              <input
                type="number"
                min="5"
                max="240"
                step="5"
                value={slotDuration}
                disabled={!canEdit}
                onChange={(e) => {
                  setSlotDuration(e.target.value);
                  setWeeklyMsg(null);
                }}
              />
            </label>
            <label className="csched-field">
              <span>
                {t("schedule.weekly.bufferMinutes", {
                  defaultValue: "Buffer between appointments (min)",
                })}
              </span>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={bufferMinutes}
                disabled={!canEdit}
                onChange={(e) => {
                  setBufferMinutes(e.target.value);
                  setWeeklyMsg(null);
                }}
              />
            </label>
            <label className="csched-field csched-field-checkbox">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!canEdit}
                onChange={(e) => {
                  setIsActive(e.target.checked);
                  setWeeklyMsg(null);
                }}
              />
              <span>
                {t("schedule.weekly.isActive", {
                  defaultValue: "Schedule active",
                })}
              </span>
            </label>
          </div>

          {weeklyMsg && (
            <div
              className={`csched-msg ${
                weeklyMsg.kind === "ok" ? "is-ok" : "is-err"
              }`}
            >
              {weeklyMsg.text}
            </div>
          )}

          {canEdit && (
            <div className="csched-actions">
              <button
                type="button"
                className="csched-btn-primary"
                onClick={handleSaveWeekly}
                disabled={savingWeekly}
              >
                {savingWeekly
                  ? t("schedule.saving", { defaultValue: "Saving…" })
                  : t("schedule.weekly.save", {
                      defaultValue: "Save schedule",
                    })}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── EXCEPTIONS TAB ─── */}
      {activeTab === "exceptions" && (
        <section className="csched-section">
          <div className="csched-section-head">
            <h2>
              {t("schedule.exceptions.title", {
                defaultValue: "Schedule exceptions",
              })}
            </h2>
            <p className="csched-section-sub">
              {t("schedule.exceptions.subtitle", {
                defaultValue:
                  "Specific dates that differ from the regular schedule.",
              })}
            </p>
          </div>

          {/* Range picker */}
          <div className="csched-range">
            <label className="csched-field">
              <span>
                {t("schedule.exceptions.rangeFrom", {
                  defaultValue: "Period from",
                })}
              </span>
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
            </label>
            <label className="csched-field">
              <span>
                {t("schedule.exceptions.rangeTo", { defaultValue: "to" })}
              </span>
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="csched-btn-secondary"
              onClick={() => loadExceptions(rangeFrom, rangeTo)}
              disabled={loadingExceptions}
            >
              {t("schedule.exceptions.loadRange", { defaultValue: "Show" })}
            </button>
          </div>

          {/* Add buttons */}
          {canEdit && (
            <div className="csched-add-row">
              <button
                type="button"
                className="csched-btn-secondary"
                onClick={() => setSingleModalOpen(true)}
              >
                {t("schedule.exceptions.addSingle", {
                  defaultValue: "+ Add exception",
                })}
              </button>
              <button
                type="button"
                className="csched-btn-secondary"
                onClick={() => setVacationModalOpen(true)}
              >
                {t("schedule.exceptions.addVacation", {
                  defaultValue: "+ Vacation (range)",
                })}
              </button>
            </div>
          )}

          {exceptionsMsg && (
            <div
              className={`csched-msg ${
                exceptionsMsg.kind === "ok" ? "is-ok" : "is-err"
              }`}
            >
              {exceptionsMsg.text}
            </div>
          )}

          {/* Exceptions list */}
          {loadingExceptions ? (
            <div className="csched-list-loading">
              <div className="csched-spinner" />
            </div>
          ) : exceptions.length === 0 ? (
            <div className="csched-empty">
              {t("schedule.exceptions.empty", {
                defaultValue: "No exceptions in the selected period",
              })}
            </div>
          ) : (
            <div className="csched-exceptions-list">
              {exceptions.map((exc) => (
                <ExceptionRow
                  key={exc.id}
                  exc={exc}
                  canEdit={canEdit}
                  t={t}
                  lang={i18n.language}
                  isLoading={Boolean(actionLoading[exc.id])}
                  onDelete={() => handleDeleteException(exc.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Modals ─── */}
      {singleModalOpen && (
        <SingleExceptionModal
          doctorId={doctorId}
          t={t}
          onClose={() => setSingleModalOpen(false)}
          onCreated={handleSingleCreated}
        />
      )}
      {vacationModalOpen && (
        <VacationModal
          doctorId={doctorId}
          t={t}
          onClose={() => setVacationModalOpen(false)}
          onCreated={handleVacationCreated}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENT: WeekdayRow
// ════════════════════════════════════════════════════════════════

function WeekdayRow({
  day,
  canEdit,
  t,
  onToggle,
  onAddInterval,
  onRemoveInterval,
  onUpdateInterval,
}) {
  const dayName = t(`schedule.weekdays.${day.weekday}`, {
    defaultValue: String(day.weekday),
  });

  return (
    <div className={`csched-day ${day.enabled ? "is-enabled" : ""}`}>
      <div className="csched-day-head">
        <label className="csched-day-toggle">
          <input
            type="checkbox"
            checked={day.enabled}
            disabled={!canEdit}
            onChange={onToggle}
          />
          <span className="csched-day-name">{dayName}</span>
        </label>
        <span className="csched-day-status">
          {day.enabled
            ? t("schedule.weekly.working", { defaultValue: "Working day" })
            : t("schedule.weekly.dayOff", { defaultValue: "Day off" })}
        </span>
      </div>

      {day.enabled && (
        <div className="csched-day-body">
          {day.intervals.length === 0 ? (
            <div className="csched-day-noint">
              {t("schedule.weekly.noIntervals", {
                defaultValue: "No intervals — treated as a day off",
              })}
            </div>
          ) : (
            day.intervals.map((iv, idx) => (
              <IntervalRow
                key={idx}
                interval={iv}
                canEdit={canEdit}
                t={t}
                onChange={(field, val) => onUpdateInterval(idx, field, val)}
                onRemove={() => onRemoveInterval(idx)}
              />
            ))
          )}
          {canEdit && (
            <button
              type="button"
              className="csched-btn-link"
              onClick={onAddInterval}
            >
              {t("schedule.weekly.addInterval", { defaultValue: "+ Interval" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENT: IntervalRow
// ════════════════════════════════════════════════════════════════

function IntervalRow({ interval, canEdit, t, onChange, onRemove }) {
  return (
    <div className="csched-interval">
      <label className="csched-interval-field">
        <span>{t("schedule.weekly.from", { defaultValue: "From" })}</span>
        <input
          type="time"
          value={minutesToHHMM(interval.startMinute)}
          disabled={!canEdit}
          onChange={(e) => onChange("startMinute", e.target.value)}
        />
      </label>
      <label className="csched-interval-field">
        <span>{t("schedule.weekly.to", { defaultValue: "To" })}</span>
        <input
          type="time"
          value={minutesToHHMM(interval.endMinute)}
          disabled={!canEdit}
          onChange={(e) => onChange("endMinute", e.target.value)}
        />
      </label>
      {canEdit && (
        <button type="button" className="csched-btn-remove" onClick={onRemove}>
          {t("schedule.weekly.removeInterval", { defaultValue: "Remove" })}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENT: ExceptionRow
// ════════════════════════════════════════════════════════════════

function ExceptionRow({ exc, canEdit, t, lang, isLoading, onDelete }) {
  const isDayOff = exc.type === "day_off";
  const typeLabel = isDayOff
    ? t("schedule.exceptions.typeDayOff", { defaultValue: "Day off" })
    : t("schedule.exceptions.typeCustom", { defaultValue: "Custom hours" });

  return (
    <div className={`csched-exc-row ${isLoading ? "is-loading" : ""}`}>
      <div className="csched-exc-date">
        {formatExceptionDate(exc.date, lang)}
      </div>
      <div className="csched-exc-body">
        <span
          className={`csched-exc-badge ${isDayOff ? "is-dayoff" : "is-custom"}`}
        >
          {typeLabel}
        </span>
        {!isDayOff && Array.isArray(exc.intervals) && (
          <span className="csched-exc-intervals">
            {exc.intervals
              .map(
                (iv) =>
                  `${minutesToHHMM(iv.startMinute)}–${minutesToHHMM(
                    iv.endMinute,
                  )}`,
              )
              .join(", ")}
          </span>
        )}
        {exc.note && <span className="csched-exc-note">{exc.note}</span>}
      </div>
      {canEdit && (
        <button
          type="button"
          className="csched-btn-remove"
          onClick={onDelete}
          disabled={isLoading}
        >
          {t("schedule.exceptions.delete", { defaultValue: "Delete" })}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENT: SingleExceptionModal
// ════════════════════════════════════════════════════════════════

function SingleExceptionModal({ doctorId, t, onClose, onCreated }) {
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState("day_off");
  const [intervals, setIntervals] = useState([{ ...DEFAULT_INTERVAL }]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  function addInterval() {
    setIntervals((prev) => [...prev, { ...DEFAULT_INTERVAL }]);
  }
  function removeInterval(idx) {
    setIntervals((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateInterval(idx, field, hhmm) {
    const minutes = hhmmToMinutes(hhmm);
    setIntervals((prev) =>
      prev.map((iv, i) => (i === idx ? { ...iv, [field]: minutes } : iv)),
    );
  }

  async function handleSubmit() {
    setErrMsg(null);

    if (type === "custom") {
      if (intervals.length === 0) {
        setErrMsg(
          t("schedule.weekly.noIntervals", {
            defaultValue: "No intervals — treated as a day off",
          }),
        );
        return;
      }
      for (const iv of intervals) {
        if (iv.startMinute >= iv.endMinute) {
          setErrMsg(
            t("schedule.weekly.invalidInterval", {
              defaultValue: "Start time must be before end time",
            }),
          );
          return;
        }
      }
    }

    const payload = {
      date,
      type,
      ...(type === "custom" && {
        intervals: intervals.map((iv) => ({
          startMinute: iv.startMinute,
          endMinute: iv.endMinute,
        })),
      }),
      ...(note.trim() && { note: note.trim() }),
    };

    setSubmitting(true);
    try {
      await createScheduleException(doctorId, payload);
      onCreated();
    } catch (err) {
      setErrMsg(
        err.response?.data?.error ||
          t("schedule.exceptions.singleModal.createError", {
            defaultValue: "Failed to create exception",
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="csched-modal-overlay"
      onClick={(e) => {
        // Close ONLY on direct clicks on the backdrop. Without this guard,
        // a click on a button inside the modal could close it if the
        // target element was removed from the DOM between click and
        // bubble (race vs stopPropagation on a re-rendered modal).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="csched-modal" role="dialog" aria-modal="true">
        <h3 className="csched-modal-title">
          {t("schedule.exceptions.singleModal.title", {
            defaultValue: "New exception",
          })}
        </h3>

        <label className="csched-field">
          <span>
            {t("schedule.exceptions.singleModal.date", {
              defaultValue: "Date",
            })}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="csched-field">
          <span>
            {t("schedule.exceptions.singleModal.type", {
              defaultValue: "Type",
            })}
          </span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="day_off">
              {t("schedule.exceptions.singleModal.typeDayOffLabel", {
                defaultValue: "Day off — doctor not working",
              })}
            </option>
            <option value="custom">
              {t("schedule.exceptions.singleModal.typeCustomLabel", {
                defaultValue: "Custom hours — different working time",
              })}
            </option>
          </select>
        </label>

        {type === "custom" && (
          <div className="csched-modal-intervals">
            <span className="csched-modal-label">
              {t("schedule.exceptions.singleModal.intervals", {
                defaultValue: "Working intervals",
              })}
            </span>
            {intervals.map((iv, idx) => (
              <IntervalRow
                key={idx}
                interval={iv}
                canEdit
                t={t}
                onChange={(field, val) => updateInterval(idx, field, val)}
                onRemove={() => removeInterval(idx)}
              />
            ))}
            <button
              type="button"
              className="csched-btn-link"
              onClick={addInterval}
            >
              {t("schedule.exceptions.singleModal.addInterval", {
                defaultValue: "+ Interval",
              })}
            </button>
          </div>
        )}

        <label className="csched-field">
          <span>{t("schedule.exceptions.note", { defaultValue: "Note" })}</span>
          <input
            type="text"
            maxLength={200}
            value={note}
            placeholder={t("schedule.exceptions.singleModal.notePlaceholder", {
              defaultValue: "E.g. Conference, Public holiday",
            })}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {errMsg && <div className="csched-msg is-err">{errMsg}</div>}

        <div className="csched-modal-actions">
          <button
            type="button"
            className="csched-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("schedule.exceptions.singleModal.cancel", {
              defaultValue: "Cancel",
            })}
          </button>
          <button
            type="button"
            className="csched-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("schedule.saving", { defaultValue: "Saving…" })
              : t("schedule.exceptions.singleModal.submit", {
                  defaultValue: "Create",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENT: VacationModal
// ════════════════════════════════════════════════════════════════

function VacationModal({ doctorId, t, onClose, onCreated }) {
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  async function handleSubmit() {
    setErrMsg(null);

    if (startDate > endDate) {
      setErrMsg(
        t("schedule.weekly.invalidInterval", {
          defaultValue: "Start time must be before end time",
        }),
      );
      return;
    }

    const payload = {
      startDate,
      endDate,
      ...(note.trim() && { note: note.trim() }),
    };

    setSubmitting(true);
    try {
      const res = await bulkCreateDayOff(doctorId, payload);
      onCreated(res?.created ?? 0);
    } catch (err) {
      setErrMsg(
        err.response?.data?.error ||
          t("schedule.exceptions.vacationModal.createError", {
            defaultValue: "Failed to create vacation",
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="csched-modal-overlay"
      onClick={(e) => {
        // Close ONLY on direct clicks on the backdrop. Without this guard,
        // a click on a button inside the modal could close it if the
        // target element was removed from the DOM between click and
        // bubble (race vs stopPropagation on a re-rendered modal).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="csched-modal" role="dialog" aria-modal="true">
        <h3 className="csched-modal-title">
          {t("schedule.exceptions.vacationModal.title", {
            defaultValue: "Vacation — date range",
          })}
        </h3>
        <p className="csched-modal-sub">
          {t("schedule.exceptions.vacationModal.subtitle", {
            defaultValue: "Every day in the range will be marked as a day off.",
          })}
        </p>

        <label className="csched-field">
          <span>
            {t("schedule.exceptions.vacationModal.startDate", {
              defaultValue: "Start",
            })}
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="csched-field">
          <span>
            {t("schedule.exceptions.vacationModal.endDate", {
              defaultValue: "End",
            })}
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label className="csched-field">
          <span>{t("schedule.exceptions.note", { defaultValue: "Note" })}</span>
          <input
            type="text"
            maxLength={200}
            value={note}
            placeholder={t(
              "schedule.exceptions.vacationModal.notePlaceholder",
              { defaultValue: "E.g. Annual leave" },
            )}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {errMsg && <div className="csched-msg is-err">{errMsg}</div>}

        <div className="csched-modal-actions">
          <button
            type="button"
            className="csched-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("schedule.exceptions.vacationModal.cancel", {
              defaultValue: "Cancel",
            })}
          </button>
          <button
            type="button"
            className="csched-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("schedule.saving", { defaultValue: "Saving…" })
              : t("schedule.exceptions.vacationModal.submit", {
                  defaultValue: "Mark as days off",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
