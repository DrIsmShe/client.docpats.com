// client/src/pages/clinic/ClinicEquipmentPage/EquipmentFormModal.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  createEquipment,
  updateEquipment,
  listStaff,
} from "../../../api/clinic";
import "./equipmentFormModal.css";

const STATUSES = ["operational", "maintenance", "broken", "decommissioned"];
const CATEGORIES = [
  "diagnostic",
  "imaging",
  "surgical",
  "monitoring",
  "laboratory",
  "therapeutic",
  "sterilization",
  "life_support",
  "furniture",
  "it",
  "other",
];

function extractId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  return "";
}

// Trim an ISO/Date down to YYYY-MM-DD for <input type="date">.
function toDateInput(v) {
  if (!v) return "";
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function EquipmentFormModal({
  equipment,
  departments = [],
  rooms = [],
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation("clinic");
  const isEdit = Boolean(equipment);

  const [departmentId, setDepartmentId] = useState(
    extractId(equipment?.departmentId) ||
      (departments.length === 1 ? String(departments[0]._id) : ""),
  );
  const [roomId, setRoomId] = useState(extractId(equipment?.roomId));
  const [name, setName] = useState(equipment?.name || "");
  const [inventoryNumber, setInventoryNumber] = useState(
    equipment?.inventoryNumber || "",
  );
  const [category, setCategory] = useState(equipment?.category || "other");
  const [status, setStatus] = useState(equipment?.status || "operational");
  const [manufacturer, setManufacturer] = useState(
    equipment?.manufacturer || "",
  );
  const [model, setModel] = useState(equipment?.model || "");
  const [serialNumber, setSerialNumber] = useState(
    equipment?.serialNumber || "",
  );
  const [purchaseDate, setPurchaseDate] = useState(
    toDateInput(equipment?.purchaseDate),
  );
  const [warrantyUntil, setWarrantyUntil] = useState(
    toDateInput(equipment?.warrantyUntil),
  );
  const [lastServiceDate, setLastServiceDate] = useState(
    toDateInput(equipment?.lastServiceDate),
  );
  const [nextServiceDate, setNextServiceDate] = useState(
    toDateInput(equipment?.nextServiceDate),
  );
  const [notes, setNotes] = useState(equipment?.notes || "");
  const [assigned, setAssigned] = useState(
    new Set((equipment?.assignedMembershipIds || []).map((id) => String(id))),
  );

  const [staff, setStaff] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    listStaff()
      .then((res) => {
        if (!cancelled) setStaff(res.items || []);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cascade: only rooms of the selected department are selectable.
  const roomsForDept = useMemo(() => {
    if (!departmentId) return [];
    return rooms.filter(
      (r) => String(extractId(r.departmentId)) === String(departmentId),
    );
  }, [rooms, departmentId]);

  // When department changes, drop a room that no longer belongs to it.
  useEffect(() => {
    if (!roomId) return;
    const stillValid = roomsForDept.some(
      (r) => String(r._id || r.id) === String(roomId),
    );
    if (!stillValid) setRoomId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

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
    if (!departmentId)
      fe.departmentId = t("equipment.form.errors.departmentRequired", {
        defaultValue: "Выберите отделение",
      });
    if (!name.trim())
      fe.name = t("equipment.form.errors.nameRequired", {
        defaultValue: "Введите название",
      });
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    const payload = {
      departmentId,
      name: name.trim(),
      category,
      status,
      ...(roomId && { roomId }),
      ...(inventoryNumber.trim() && {
        inventoryNumber: inventoryNumber.trim(),
      }),
      ...(manufacturer.trim() && { manufacturer: manufacturer.trim() }),
      ...(model.trim() && { model: model.trim() }),
      ...(serialNumber.trim() && { serialNumber: serialNumber.trim() }),
      ...(purchaseDate && { purchaseDate }),
      ...(warrantyUntil && { warrantyUntil }),
      ...(lastServiceDate && { lastServiceDate }),
      ...(nextServiceDate && { nextServiceDate }),
      ...(notes.trim() && { notes: notes.trim() }),
      assignedMembershipIds: Array.from(assigned),
    };
    // On edit, allow clearing the room explicitly.
    if (isEdit && !roomId) payload.roomId = null;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateEquipment(equipment._id || equipment.id, payload);
      } else {
        await createEquipment(payload);
      }
      onSuccess();
    } catch (err) {
      const httpStatus = err.response?.status;
      const data = err.response?.data;
      if (httpStatus === 400 && data?.details?.issues) {
        const errs = {};
        for (const issue of data.details.issues) {
          const field = issue.path?.[0];
          if (field) errs[field] = issue.message;
        }
        setFieldErrors(errs);
        setError(
          t("equipment.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else if (httpStatus === 409) {
        setFieldErrors({
          inventoryNumber: t("equipment.form.errors.inventoryTaken", {
            defaultValue: "Такой инвентарный номер уже используется",
          }),
        });
        setError(
          t("equipment.form.errors.fix", {
            defaultValue: "Исправьте ошибки в форме",
          }),
        );
      } else {
        setError(
          data?.error ||
            t("equipment.form.errors.generic", {
              defaultValue: "Не удалось сохранить оборудование",
            }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Archived department of an edited item kept selectable.
  const archivedDeptSelected =
    departmentId &&
    !departments.some((d) => String(d._id) === String(departmentId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            {isEdit
              ? t("equipment.form.editTitle", {
                  defaultValue: "Редактировать оборудование",
                })
              : t("equipment.form.createTitle", {
                  defaultValue: "Новое оборудование",
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

          {/* Department + Room cascade */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-dept">
                {t("equipment.form.department", { defaultValue: "Отделение" })}{" "}
                <span className="required">*</span>
              </label>
              <select
                id="eq-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={submitting}
                className={fieldErrors.departmentId ? "has-error" : ""}
              >
                <option value="">
                  {t("equipment.form.departmentNone", {
                    defaultValue: "— выберите отделение —",
                  })}
                </option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name}
                  </option>
                ))}
                {archivedDeptSelected && (
                  <option value={departmentId}>
                    {t("equipment.form.departmentArchived", {
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

            <div className="modal-field">
              <label htmlFor="eq-room">
                {t("equipment.form.room", { defaultValue: "Кабинет" })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <select
                id="eq-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={submitting || !departmentId}
              >
                <option value="">
                  {t("equipment.form.roomNone", {
                    defaultValue: "— не закреплён —",
                  })}
                </option>
                {roomsForDept.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div className="modal-field">
            <label htmlFor="eq-name">
              {t("equipment.form.name", { defaultValue: "Название" })}{" "}
              <span className="required">*</span>
            </label>
            <input
              id="eq-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={200}
              placeholder={t("equipment.form.namePlaceholder", {
                defaultValue: "Аппарат УЗИ",
              })}
              className={fieldErrors.name ? "has-error" : ""}
              autoFocus
            />
            {fieldErrors.name && (
              <div className="modal-field-error">{fieldErrors.name}</div>
            )}
          </div>

          {/* Category + Status */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-category">
                {t("equipment.form.category", { defaultValue: "Категория" })}
              </label>
              <select
                id="eq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`equipment.category.${c}`, { defaultValue: c })}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label htmlFor="eq-status">
                {t("equipment.form.status", { defaultValue: "Статус" })}
              </label>
              <select
                id="eq-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`equipment.status.${s}`, { defaultValue: s })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory + Serial */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-inv">
                {t("equipment.form.inventoryNumber", {
                  defaultValue: "Инвентарный №",
                })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="eq-inv"
                type="text"
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
                disabled={submitting}
                maxLength={64}
                placeholder="INV-001"
                className={fieldErrors.inventoryNumber ? "has-error" : ""}
              />
              {fieldErrors.inventoryNumber && (
                <div className="modal-field-error">
                  {fieldErrors.inventoryNumber}
                </div>
              )}
            </div>
            <div className="modal-field">
              <label htmlFor="eq-serial">
                {t("equipment.form.serialNumber", {
                  defaultValue: "Серийный №",
                })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="eq-serial"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                disabled={submitting}
                maxLength={200}
              />
            </div>
          </div>

          {/* Manufacturer + Model */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-mfr">
                {t("equipment.form.manufacturer", {
                  defaultValue: "Производитель",
                })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="eq-mfr"
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                disabled={submitting}
                maxLength={200}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="eq-model">
                {t("equipment.form.model", { defaultValue: "Модель" })}{" "}
                <span className="optional">
                  {t("common.optional", { defaultValue: "необязательно" })}
                </span>
              </label>
              <input
                id="eq-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={submitting}
                maxLength={200}
              />
            </div>
          </div>

          {/* Purchase + Warranty */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-purchase">
                {t("equipment.form.purchaseDate", {
                  defaultValue: "Дата покупки",
                })}
              </label>
              <input
                id="eq-purchase"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="eq-warranty">
                {t("equipment.form.warrantyUntil", {
                  defaultValue: "Гарантия до",
                })}
              </label>
              <input
                id="eq-warranty"
                type="date"
                value={warrantyUntil}
                onChange={(e) => setWarrantyUntil(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Last + Next service */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="eq-last-service">
                {t("equipment.form.lastServiceDate", {
                  defaultValue: "Последнее ТО",
                })}
              </label>
              <input
                id="eq-last-service"
                type="date"
                value={lastServiceDate}
                onChange={(e) => setLastServiceDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="eq-next-service">
                {t("equipment.form.nextServiceDate", {
                  defaultValue: "Следующее ТО",
                })}
              </label>
              <input
                id="eq-next-service"
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Assigned staff */}
          <div className="modal-field">
            <label>
              {t("equipment.form.assignedStaff", {
                defaultValue: "Ответственные",
              })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            {staff.length === 0 ? (
              <div className="modal-hint">
                {t("equipment.form.noStaff", {
                  defaultValue: "В клинике пока нет сотрудников",
                })}
              </div>
            ) : (
              <div className="equip-staff-list">
                {staff.map((m) => {
                  const id = membershipIdOf(m);
                  return (
                    <label key={id} className="equip-staff-item">
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
            <label htmlFor="eq-notes">
              {t("equipment.form.notes", { defaultValue: "Заметки" })}{" "}
              <span className="optional">
                {t("common.optional", { defaultValue: "необязательно" })}
              </span>
            </label>
            <textarea
              id="eq-notes"
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
