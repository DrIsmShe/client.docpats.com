// client/src/pages/clinic/ClinicTelemedPage/TelemedFormModal.jsx
//
// Create / reschedule a telemed session. Date and time are separate inputs;
// they are combined into one local Date and sent as an ISO string. The parent
// passes an async onSubmit performing create-or-update.

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./telemedFormModal.css";

const DURATIONS = [15, 20, 30, 45, 60, 90];

function extractId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  return "";
}

// Split an ISO/Date into local "YYYY-MM-DD" + "HH:MM" for the inputs.
function splitDateTime(v) {
  if (!v) return { date: "", time: "" };
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

export default function TelemedFormModal({
  session,
  departments = [],
  staff = [],
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = Boolean(session);

  const initial = splitDateTime(session?.scheduledAt);
  const [title, setTitle] = useState(session?.title || "");
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [durationMinutes, setDurationMinutes] = useState(
    session?.durationMinutes || 30,
  );
  const [hostMembershipId, setHostMembershipId] = useState(
    extractId(session?.hostMembershipId),
  );
  const [departmentId, setDepartmentId] = useState(
    extractId(session?.departmentId),
  );
  const [notes, setNotes] = useState(session?.notes || "");
  const [meetingUrl, setMeetingUrl] = useState(session?.meetingUrl || "");
  const [patientUserId, setPatientUserId] = useState(
    session?.patientUserId ? String(session.patientUserId) : "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function membershipIdOf(m) {
    return String(m.membershipId || m._id || m.id);
  }
  function staffName(m) {
    return (
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.email ||
      m.username ||
      "—"
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fe = {};
    if (!title.trim())
      fe.title = t("telemed.form.errors.titleRequired", {
        defaultValue: "Введите тему",
      });
    if (!date || !time)
      fe.scheduledAt = t("telemed.form.errors.dateRequired", {
        defaultValue: "Укажите дату и время",
      });
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    // Combine into a local Date, then ISO for the server.
    const local = new Date(`${date}T${time}`);
    if (Number.isNaN(local.getTime())) {
      setFieldErrors({
        scheduledAt: t("telemed.form.errors.dateInvalid", {
          defaultValue: "Неверная дата/время",
        }),
      });
      return;
    }

    const payload = {
      title: title.trim(),
      scheduledAt: local.toISOString(),
      durationMinutes: Number(durationMinutes),
      ...(hostMembershipId
        ? { hostMembershipId }
        : isEdit
          ? { hostMembershipId: null }
          : {}),
      ...(departmentId
        ? { departmentId }
        : isEdit
          ? { departmentId: null }
          : {}),
      ...(notes.trim()
        ? { notes: notes.trim() }
        : isEdit
          ? { notes: null }
          : {}),
      ...(meetingUrl.trim()
        ? { meetingUrl: meetingUrl.trim() }
        : isEdit
          ? { meetingUrl: null }
          : {}),
      ...(patientUserId.trim()
        ? { patientUserId: patientUserId.trim() }
        : isEdit
          ? { patientUserId: null }
          : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 400 && data?.details?.issues) {
        const errs = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) errs[field] = issue.message;
        }
        setFieldErrors(errs);
        setError(
          t("telemed.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("telemed.form.errors.generic", {
              defaultValue: "Не удалось сохранить приём",
            }),
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window tm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>
            {isEdit
              ? t("telemed.form.editTitle", { defaultValue: "Изменить приём" })
              : t("telemed.form.createTitle", {
                  defaultValue: "Новый виртуальный приём",
                })}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label={t("common.cancel", { defaultValue: "Отмена" })}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="tm-title">
              {t("telemed.form.titleLabel", { defaultValue: "Тема приёма" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="tm-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={300}
              className={fieldErrors.title ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.title && (
              <div className="modal-field-error">{fieldErrors.title}</div>
            )}
          </div>

          {/* Date + Time (separate) */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="tm-date">
                {t("telemed.form.date", { defaultValue: "Дата" })}{" "}
                <span className="required">*</span>
              </label>
              <input
                id="tm-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                className={fieldErrors.scheduledAt ? "has-error" : ""}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="tm-time">
                {t("telemed.form.time", { defaultValue: "Время" })}{" "}
                <span className="required">*</span>
              </label>
              <input
                id="tm-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={submitting}
                className={fieldErrors.scheduledAt ? "has-error" : ""}
              />
            </div>
          </div>
          {fieldErrors.scheduledAt && (
            <div className="modal-field-error" style={{ marginTop: -6 }}>
              {fieldErrors.scheduledAt}
            </div>
          )}

          {/* Duration + Host */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="tm-duration">
                {t("telemed.form.duration", { defaultValue: "Длительность" })}
              </label>
              <select
                id="tm-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={submitting}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} {t("telemed.min", { defaultValue: "мин" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label htmlFor="tm-host">
                {t("telemed.form.host", { defaultValue: "Врач" })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <select
                id="tm-host"
                value={hostMembershipId}
                onChange={(e) => setHostMembershipId(e.target.value)}
                disabled={submitting}
              >
                <option value="">
                  {t("telemed.form.hostNone", {
                    defaultValue: "— не указан —",
                  })}
                </option>
                {staff.map((m) => {
                  const mid = membershipIdOf(m);
                  return (
                    <option key={mid} value={mid}>
                      {staffName(m)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Department */}
          <div className="modal-field">
            <label htmlFor="tm-dept">
              {t("telemed.form.department", { defaultValue: "Отделение" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <select
              id="tm-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
            >
              <option value="">
                {t("telemed.form.departmentNone", {
                  defaultValue: "— не указано —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* External meeting link (Variant 3) */}
          <div className="modal-field">
            <label htmlFor="tm-meeting-url">
              {t("telemed.form.meetingUrl", {
                defaultValue: "Ссылка на видеовстречу",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <input
              id="tm-meeting-url"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              disabled={submitting}
              maxLength={1000}
              placeholder="https://meet.jit.si/…"
              className={fieldErrors.meetingUrl ? "has-error" : ""}
            />
            {fieldErrors.meetingUrl ? (
              <div className="modal-field-error">{fieldErrors.meetingUrl}</div>
            ) : (
              <div className="modal-hint">
                {t("telemed.form.meetingUrlHint", {
                  defaultValue:
                    "Оставьте пустым — комната создастся автоматически. Можно вписать свою ссылку (Doxy.me, Zoom и т.п.).",
                })}
              </div>
            )}
          </div>

          {/* Patient user id (Variant 1 — built-in video call) */}
          <div className="modal-field">
            <label htmlFor="tm-patient-user">
              {t("telemed.form.patientUserId", {
                defaultValue: "User ID пациента (встроенный звонок)",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <input
              id="tm-patient-user"
              type="text"
              value={patientUserId}
              onChange={(e) => setPatientUserId(e.target.value)}
              disabled={submitting}
              maxLength={24}
              placeholder="6a1d…"
              className={fieldErrors.patientUserId ? "has-error" : ""}
            />
            {fieldErrors.patientUserId ? (
              <div className="modal-field-error">
                {fieldErrors.patientUserId}
              </div>
            ) : (
              <div className="modal-hint">
                {t("telemed.form.patientUserIdHint", {
                  defaultValue:
                    "Если пациент зарегистрирован в DocPats — «Войти» начнёт видеозвонок. Иначе используйте ссылку выше.",
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="modal-field">
            <label htmlFor="tm-notes">
              {t("telemed.form.notes", { defaultValue: "Заметки" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="tm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={3}
              maxLength={2000}
            />
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel", { defaultValue: "Отмена" })}
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={submitting}
            >
              {submitting
                ? t("common.saving", { defaultValue: "Сохранение…" })
                : t("common.save", { defaultValue: "Сохранить" })}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
