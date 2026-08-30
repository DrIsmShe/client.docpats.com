// client/src/pages/clinic/ClinicEquipmentPage/ClinicEquipmentPage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
import {
  listEquipment,
  listDepartments,
  listRooms,
  archiveEquipment,
  updateEquipment,
} from "../../../api/clinic";
import EquipmentFormModal from "./EquipmentFormModal";
import "./clinicEquipmentPage.css";

const STATUSES = [
  "operational",
  "maintenance",
  "broken",
  "decommissioned",
  "archived",
];
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
const GROUP_MODES = ["department", "category", "status", "flat"];

export default function ClinicEquipmentPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const { basePath, dashboardPath, loginPath } = useClinicZone();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupMode, setGroupMode] = useState("department");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Permission-based gating — mirrors backend RBAC (EQUIPMENT resource).
  // admin has EQUIPMENT:RO → create/edit/archive stay hidden (no 403).
  // Owner is always-full (never restricted, guards against absent perms).
  const myRole = layoutContext?.role || "member";
  const perms = layoutContext?.permissions || {};
  const isOwner = myRole === "owner";
  const canManage = isOwner || !!perms?.equipment?.write;

  const deptMap = useMemo(() => {
    const m = {};
    for (const d of departments) m[String(d._id || d.id)] = d;
    return m;
  }, [departments]);

  const roomMap = useMemo(() => {
    const m = {};
    for (const r of rooms) m[String(r._id || r.id)] = r;
    return m;
  }, [rooms]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [eqRes, deptsRes, roomsRes] = await Promise.all([
        listEquipment({}),
        listDepartments({}),
        listRooms({}),
      ]);
      setEquipment(eqRes.items || []);
      setDepartments(deptsRes.items || []);
      setRooms(roomsRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load equipment:", err);
      if (err.response?.status === 401) {
        navigate(loginPath, { replace: true });
        return;
      }
      setError(err.message || "Failed to load equipment");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loginPath]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === "active"),
    [departments],
  );
  const activeRooms = useMemo(
    () => rooms.filter((r) => r.status === "active"),
    [rooms],
  );

  // Client-side filter: archived toggle + search + dept + category + status.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return equipment.filter((e) => {
      if (!showArchived && e.status === "archived") return false;
      if (deptFilter && String(e.departmentId) !== String(deptFilter))
        return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (e.name || "").toLowerCase().includes(q) ||
        (e.inventoryNumber || "").toLowerCase().includes(q) ||
        (e.serialNumber || "").toLowerCase().includes(q)
      );
    });
  }, [
    equipment,
    showArchived,
    deptFilter,
    categoryFilter,
    statusFilter,
    search,
  ]);

  // Group by the selected mode → [{ key, label, items: [] }].
  const grouped = useMemo(() => {
    if (groupMode === "flat") {
      return [{ key: "all", label: null, items: filtered }];
    }
    const groups = new Map();
    for (const e of filtered) {
      let key;
      let label;
      if (groupMode === "department") {
        key = String(e.departmentId);
        label =
          deptMap[key]?.name ||
          t("equipment.unknownDepartment", { defaultValue: "Без отделения" });
      } else if (groupMode === "category") {
        key = e.category || "other";
        label = t(`equipment.category.${key}`, { defaultValue: key });
      } else {
        key = e.status || "operational";
        label = t(`equipment.status.${key}`, { defaultValue: key });
      }
      if (!groups.has(key)) groups.set(key, { key, label, items: [] });
      groups.get(key).items.push(e);
    }
    return Array.from(groups.values()).sort((a, b) =>
      (a.label || "\uffff").localeCompare(b.label || "\uffff"),
    );
  }, [filtered, groupMode, deptMap, t]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(eq) {
    setEditing(eq);
    setModalOpen(true);
  }
  function handleModalSuccess() {
    setModalOpen(false);
    setEditing(null);
    loadAll();
  }

  async function handleArchive(eq) {
    if (
      !window.confirm(
        t("equipment.confirmArchive", {
          name: eq.name,
          defaultValue: `Архивировать «${eq.name}»?`,
        }),
      )
    )
      return;
    const id = eq._id || eq.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await archiveEquipment(id);
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("equipment.archiveFailed", {
            defaultValue: "Не удалось архивировать оборудование",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleRestore(eq) {
    const id = eq._id || eq.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await updateEquipment(id, { status: "operational" });
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("equipment.restoreFailed", {
            defaultValue: "Не удалось восстановить оборудование",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="equip-page-loading">
        <div className="equip-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="equip-page-error">
        <h2>{t("equipment.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  const noDepartments = activeDepartments.length === 0;

  return (
    <div className="equip-page">
      <div className="equip-page-header">
        <div className="equip-page-header-left">
          <Link to={dashboardPath} className="equip-page-back">
            {t("equipment.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("equipment.title", { defaultValue: "Оборудование" })}</h1>
          <p className="equip-page-subtitle">
            {t("equipment.subtitle", {
              defaultValue: "Оборудование клиники по отделениям",
            })}
          </p>
        </div>
        {canManage && !noDepartments && (
          <div className="equip-page-header-actions">
            <button
              className="equip-page-btn-primary"
              onClick={openCreate}
              type="button"
            >
              {t("equipment.create", { defaultValue: "Добавить оборудование" })}
            </button>
          </div>
        )}
      </div>

      {noDepartments ? (
        <div className="equip-page-empty">
          <p>
            {t("equipment.needDepartmentFirst", {
              defaultValue:
                "Сначала создайте хотя бы одно отделение — оборудование всегда принадлежит отделению.",
            })}
          </p>
          <Link to={`${basePath}/departments`} className="equip-page-btn-primary">
            {t("equipment.goToDepartments", {
              defaultValue: "Перейти к отделениям",
            })}
          </Link>
        </div>
      ) : (
        <>
          <div className="equip-page-toolbar">
            <input
              className="equip-page-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("equipment.searchPlaceholder", {
                defaultValue: "Поиск: название, инв. №, серийный…",
              })}
            />
            <select
              className="equip-page-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">
                {t("equipment.allDepartments", {
                  defaultValue: "Все отделения",
                })}
              </option>
              {activeDepartments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className="equip-page-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">
                {t("equipment.allCategories", {
                  defaultValue: "Все категории",
                })}
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`equipment.category.${c}`, { defaultValue: c })}
                </option>
              ))}
            </select>
            <select
              className="equip-page-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">
                {t("equipment.allStatuses", { defaultValue: "Все статусы" })}
              </option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`equipment.status.${s}`, { defaultValue: s })}
                </option>
              ))}
            </select>
            <label className="equip-page-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              {t("equipment.showArchived", { defaultValue: "Архив" })}
            </label>
          </div>

          {/* Group-by mode switcher */}
          <div className="equip-page-groupby">
            <span className="equip-page-groupby-label">
              {t("equipment.groupBy", { defaultValue: "Группировка:" })}
            </span>
            {GROUP_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`equip-page-groupby-btn ${
                  groupMode === mode ? "is-active" : ""
                }`}
                onClick={() => setGroupMode(mode)}
              >
                {t(`equipment.groupMode.${mode}`, { defaultValue: mode })}
              </button>
            ))}
          </div>

          <section className="equip-page-section">
            <h2>
              {t("equipment.listTitle", {
                defaultValue: "Список оборудования",
              })}
              <span className="equip-page-count">{filtered.length}</span>
            </h2>

            {filtered.length === 0 ? (
              <div className="equip-page-empty">
                <p>
                  {t("equipment.empty", {
                    defaultValue: "Оборудования пока нет",
                  })}
                </p>
                {canManage && (
                  <button
                    className="equip-page-btn-primary"
                    onClick={openCreate}
                    type="button"
                  >
                    {t("equipment.createFirst", {
                      defaultValue: "Добавить первое оборудование",
                    })}
                  </button>
                )}
              </div>
            ) : (
              <div className="equip-page-groups">
                {grouped.map((group) => (
                  <div className="equip-group" key={group.key}>
                    {group.label && (
                      <div className="equip-group-title">
                        {group.label}
                        <span className="equip-group-count">
                          {group.items.length}
                        </span>
                      </div>
                    )}
                    <div className="equip-page-list">
                      {group.items.map((eq) => (
                        <EquipmentRow
                          key={eq._id || eq.id}
                          eq={eq}
                          deptMap={deptMap}
                          roomMap={roomMap}
                          groupMode={groupMode}
                          canManage={canManage}
                          onEdit={openEdit}
                          onArchive={handleArchive}
                          onRestore={handleRestore}
                          isLoading={actionLoading[eq._id || eq.id]}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {modalOpen && (
        <EquipmentFormModal
          equipment={editing}
          departments={activeDepartments}
          rooms={activeRooms}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// ─── Sub-component ───

function EquipmentRow({
  eq,
  deptMap,
  roomMap,
  groupMode,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  isLoading,
  t,
}) {
  const archived = eq.status === "archived";
  const deptName = deptMap[String(eq.departmentId)]?.name;
  const roomName = eq.roomId ? roomMap[String(eq.roomId)]?.name : null;
  const assignedCount = Array.isArray(eq.assignedMembershipIds)
    ? eq.assignedMembershipIds.length
    : 0;

  const fmtDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return null;
    }
  };
  const nextService = fmtDate(eq.nextServiceDate);

  return (
    <div
      className={`equip-row ${archived ? "is-archived" : ""} ${
        isLoading ? "is-loading" : ""
      }`}
    >
      <div className="equip-row-main">
        <div className="equip-row-name">
          {eq.name}
          <span className={`equip-status-badge status-${eq.status}`}>
            {t(`equipment.status.${eq.status}`, { defaultValue: eq.status })}
          </span>
        </div>
        <div className="equip-row-meta">
          {/* Show category unless we're already grouping by it */}
          {groupMode !== "category" && (
            <span className="equip-row-category">
              {t(`equipment.category.${eq.category}`, {
                defaultValue: eq.category,
              })}
            </span>
          )}
          {eq.inventoryNumber && (
            <span className="equip-row-inv">{eq.inventoryNumber}</span>
          )}
          {/* Show department unless grouping by it */}
          {groupMode !== "department" && deptName && (
            <span className="equip-row-dept">🏥 {deptName}</span>
          )}
          {roomName && <span className="equip-row-room">🚪 {roomName}</span>}
          {eq.manufacturer && (
            <span className="equip-row-mfr">{eq.manufacturer}</span>
          )}
          {assignedCount > 0 && (
            <span className="equip-row-staff">
              {t("equipment.staffCount", {
                count: assignedCount,
                defaultValue: `врачей: ${assignedCount}`,
              })}
            </span>
          )}
          {nextService && (
            <span className="equip-row-service">
              {t("equipment.nextServiceShort", { defaultValue: "ТО до" })}{" "}
              {nextService}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <div className="equip-row-actions">
          {!archived && (
            <button
              className="equip-row-btn-edit"
              onClick={() => onEdit(eq)}
              disabled={isLoading}
              type="button"
            >
              {t("common.edit", { defaultValue: "Изменить" })}
            </button>
          )}
          {archived ? (
            <button
              className="equip-row-btn-restore"
              onClick={() => onRestore(eq)}
              disabled={isLoading}
              type="button"
            >
              {t("equipment.restore", { defaultValue: "Восстановить" })}
            </button>
          ) : (
            <button
              className="equip-row-btn-archive"
              onClick={() => onArchive(eq)}
              disabled={isLoading}
              type="button"
            >
              {t("equipment.archive", { defaultValue: "В архив" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
