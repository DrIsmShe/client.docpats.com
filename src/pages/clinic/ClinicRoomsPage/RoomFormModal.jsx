// client/src/pages/clinic/ClinicRoomsPage/RoomFormModal.jsx

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createRoom, updateRoom, listStaff } from "../../../api/clinic";
import "./roomFormModal.css";

/**
 * Extract a department id from a room record (string | populated | null).
 */
function extractDepartmentId(room) {
  const d = room?.departmentId;
  if (!d) return "";
  if (typeof d === "string") return d;
  if (typeof d === "object" && d._id) return String(d._id);
  return "";
}

export default function RoomFormModal({
  room,
  departments = [],
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = Boolean(room);

  const [departmentId, setDepartmentId] = useState(
    extractDepartmentId(room) ||
      (departments.length === 1 ? String(departments[0]._id) : ""),
  );
  const [name, setName] = useState(room?.name || "");
  const [code, setCode] = useState(room?.code || "");
  const [floor, setFloor] = useState(room?.floor || "");
  const [capacity, setCapacity] = useState(
    typeof room?.capacity === "number" ? String(room.capacity) : "",
  );
  const [notes, setNotes] = useState(room?.notes || "");
  // Set of selected ClinicMembership ids (strings).
  const [assigned, setAssigned] = useState(
    new Set((room?.assignedMembershipIds || []).map((id) => String(id))),
  );

  const [staff, setStaff] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Staff list — for the room's assigned-doctors checkboxes. Optional: if it
  // fails, the rest of the form still works (assignment stays as-is).
  useEffect(() => {
    let cancelled = false;
    listStaff()
      .then((res) => {
        if (!cancelled) setStaff(res.items || []);
      })
      .catch(() => {
        /* ignore — staff assignment is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function staffName(m) {
    return (
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.email ||
      m.username ||
      "—"
    );
  }

  function membershipIdOf(m) {
    return String(m.membershipId || m._id || m.id);
  }

  function toggleAssigned(id) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fe = {};
    if (!departmentId) {
      fe.departmentId = t("rooms.form.errors.departmentRequired", {
        defaultValue: "Выберите отделение",
      });
    }
    if (!name.trim()) {
      fe.name = t("rooms.form.errors.nameRequired", {
        defaultValue: "Введите название",
      });
    }
    // capacity: optional, but if present must be a non-negative integer.
    let capacityNum;
    if (capacity.trim() !== "") {
      capacityNum = Number(capacity);
      if (!Number.isInteger(capacityNum) || capacityNum < 0) {
        fe.capacity = t("rooms.form.errors.capacityInvalid", {
          defaultValue: "Вместимость — целое число ≥ 0",
        });
      }
    }
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    const payload = {
      departmentId,
      name: name.trim(),
      ...(code.trim() && { code: code.trim() }),
      ...(floor.trim() && { floor: floor.trim() }),
      ...(capacity.trim() !== "" && { capacity: capacityNum }),
      ...(notes.trim() && { notes: notes.trim() }),
      assignedMembershipIds: Array.from(assigned),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateRoom(room._id || room.id, payload);
      } else {
        await createRoom(payload);
      }
      onSuccess();
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
          t("rooms.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else if (status === 409) {
        setFieldErrors({
          code: t("rooms.form.errors.codeTaken", {
            defaultValue: "Такой код уже используется в клинике",
          }),
        });
        setError(
          t("rooms.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("rooms.form.errors.generic", {
              defaultValue: "Не удалось сохранить кабинет",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // If editing a room whose department is archived (not in the active list),
  // keep it selectable so we don't silently drop it.
  const archivedSelected =
    departmentId &&
    !departments.some((d) => String(d._id) === String(departmentId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            {isEdit
              ? t("rooms.form.editTitle", {
                  defaultValue: "Редактировать кабинет",
                })
              : t("rooms.form.createTitle", { defaultValue: "Новый кабинет" })}
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

          {/* Department (required) */}
          <div className="modal-field">
            <label htmlFor="room-dept">
              {t("rooms.form.department", { defaultValue: "Отделение" })}{" "}
              <span className="required">*</span>
            </label>
            <select
              id="room-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
              className={fieldErrors.departmentId ? "has-error" : ""}
            >
              <option value="">
                {t("rooms.form.departmentNone", {
                  defaultValue: "— выберите отделение —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
              {archivedSelected && (
                <option value={departmentId}>
                  {extractDepartmentId(room) === departmentId &&
                  room?.departmentId?.name
                    ? room.departmentId.name
                    : t("rooms.form.departmentArchived", {
                        defaultValue: "(архивное отделение)",
                      })}
                </option>
              )}
            </select>
            {fieldErrors.departmentId && (
              <div className="modal-field-error">
                {fieldErrors.departmentId}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="modal-field">
            <label htmlFor="room-name">
              {t("rooms.form.name", { defaultValue: "Название" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={200}
              placeholder={t("rooms.form.namePlaceholder", {
                defaultValue: "Кабинет №12",
              })}
              className={fieldErrors.name ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.name && (
              <div className="modal-field-error">{fieldErrors.name}</div>
            )}
          </div>

          {/* Code + Floor (row) */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="room-code">
                {t("rooms.form.code", { defaultValue: "Код" })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="room-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
                maxLength={40}
                placeholder="R12"
                className={fieldErrors.code ? "has-error" : ""}
              />
              {fieldErrors.code && (
                <div className="modal-field-error">{fieldErrors.code}</div>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="room-floor">
                {t("rooms.form.floor", { defaultValue: "Этаж" })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="room-floor"
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                disabled={submitting}
                maxLength={40}
                placeholder="2"
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="modal-field">
            <label htmlFor="room-capacity">
              {t("rooms.form.capacity", { defaultValue: "Вместимость" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <input
              id="room-capacity"
              type="number"
              min="0"
              step="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              disabled={submitting}
              placeholder="4"
              className={fieldErrors.capacity ? "has-error" : ""}
            />
            {fieldErrors.capacity && (
              <div className="modal-field-error">{fieldErrors.capacity}</div>
            )}
          </div>

          {/* Assigned staff (checkboxes) */}
          <div className="modal-field">
            <label>
              {t("rooms.form.assignedStaff", {
                defaultValue: "Врачи в кабинете",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            {staff.length === 0 ? (
              <div className="modal-hint">
                {t("rooms.form.noStaff", {
                  defaultValue: "В клинике пока нет сотрудников",
                })}
              </div>
            ) : (
              <div className="room-staff-list">
                {staff.map((m) => {
                  const id = membershipIdOf(m);
                  return (
                    <label key={id} className="room-staff-item">
                      <input
                        type="checkbox"
                        checked={assigned.has(id)}
                        onChange={() => toggleAssigned(id)}
                        disabled={submitting}
                      />
                      <span>{staffName(m)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="modal-field">
            <label htmlFor="room-notes">
              {t("rooms.form.notes", { defaultValue: "Заметки" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="room-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              maxLength={2000}
              rows={3}
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
