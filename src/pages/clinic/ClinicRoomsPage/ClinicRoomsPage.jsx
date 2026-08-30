// client/src/pages/clinic/ClinicRoomsPage/ClinicRoomsPage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicZone } from "../../../lib/useClinicZone";
import {
  listRooms,
  listDepartments,
  archiveRoom,
  updateRoom,
} from "../../../api/clinic";
import RoomFormModal from "./RoomFormModal";
import "./clinicRoomsPage.css";

export default function ClinicRoomsPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const { basePath, dashboardPath, loginPath } = useClinicZone();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(""); // "" = all departments
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, room = edit

  // Permission-based gating — mirrors backend RBAC (ROOM resource).
  // admin has ROOM:RO → create/edit/archive stay hidden (no 403).
  // Owner is always-full (never restricted, guards against absent perms).
  const myRole = layoutContext?.role || "member";
  const perms = layoutContext?.permissions || {};
  const isOwner = myRole === "owner";
  const canManage = isOwner || !!perms?.room?.write;

  // Map departmentId → dept (for resolving names on each room row).
  const deptMap = useMemo(() => {
    const m = {};
    for (const d of departments) m[String(d._id || d.id)] = d;
    return m;
  }, [departments]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [roomsRes, deptsRes] = await Promise.all([
        listRooms(showArchived ? {} : { status: "active" }),
        listDepartments({}), // include archived so names always resolve
      ]);
      setRooms(roomsRes.items || []);
      setDepartments(deptsRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      if (err.response?.status === 401) {
        navigate(loginPath, { replace: true });
        return;
      }
      setError(err.message || "Failed to load rooms");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loginPath, showArchived]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Active departments only — for the create/edit modal + the filter select.
  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === "active"),
    [departments],
  );

  // Client-side filter: search (name/code) + department.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (deptFilter && String(r.departmentId) !== String(deptFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.code || "").toLowerCase().includes(q)
      );
    });
  }, [rooms, search, deptFilter]);

  // Group filtered rooms by department for display.
  const grouped = useMemo(() => {
    const groups = new Map(); // deptId → { dept, rooms: [] }
    for (const r of filtered) {
      const did = String(r.departmentId);
      if (!groups.has(did)) {
        groups.set(did, { dept: deptMap[did] || null, rooms: [] });
      }
      groups.get(did).rooms.push(r);
    }
    // Sort groups by department name (unknown dept last).
    return Array.from(groups.values()).sort((a, b) => {
      const an = a.dept?.name || "\uffff";
      const bn = b.dept?.name || "\uffff";
      return an.localeCompare(bn);
    });
  }, [filtered, deptMap]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(room) {
    setEditing(room);
    setModalOpen(true);
  }

  function handleModalSuccess() {
    setModalOpen(false);
    setEditing(null);
    loadAll();
  }

  async function handleArchive(room) {
    if (
      !window.confirm(
        t("rooms.confirmArchive", {
          name: room.name,
          defaultValue: `Архивировать «${room.name}»?`,
        }),
      )
    )
      return;

    const id = room._id || room.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await archiveRoom(id);
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("rooms.archiveFailed", {
            defaultValue: "Не удалось архивировать кабинет",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleRestore(room) {
    const id = room._id || room.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await updateRoom(id, { status: "active" });
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("rooms.restoreFailed", {
            defaultValue: "Не удалось восстановить кабинет",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="room-page-loading">
        <div className="room-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-page-error">
        <h2>{t("rooms.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  const noDepartments = activeDepartments.length === 0;

  return (
    <div className="room-page">
      <div className="room-page-header">
        <div className="room-page-header-left">
          <Link to={dashboardPath} className="room-page-back">
            {t("rooms.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("rooms.title", { defaultValue: "Кабинеты" })}</h1>
          <p className="room-page-subtitle">
            {t("rooms.subtitle", {
              defaultValue: "Кабинеты клиники по отделениям",
            })}
          </p>
        </div>
        {canManage && !noDepartments && (
          <div className="room-page-header-actions">
            <button
              className="room-page-btn-primary"
              onClick={openCreate}
              type="button"
            >
              {t("rooms.create", { defaultValue: "Создать кабинет" })}
            </button>
          </div>
        )}
      </div>

      {/* No departments yet → rooms can't exist. Guide the user. */}
      {noDepartments ? (
        <div className="room-page-empty">
          <p>
            {t("rooms.needDepartmentFirst", {
              defaultValue:
                "Сначала создайте хотя бы одно отделение — кабинет всегда принадлежит отделению.",
            })}
          </p>
          <Link to={`${basePath}/departments`} className="room-page-btn-primary">
            {t("rooms.goToDepartments", {
              defaultValue: "Перейти к отделениям",
            })}
          </Link>
        </div>
      ) : (
        <>
          <div className="room-page-toolbar">
            <input
              className="room-page-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("rooms.searchPlaceholder", {
                defaultValue: "Поиск по названию или коду…",
              })}
            />
            <select
              className="room-page-dept-filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">
                {t("rooms.allDepartments", {
                  defaultValue: "Все отделения",
                })}
              </option>
              {activeDepartments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <label className="room-page-toggle">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              {t("rooms.showArchived", { defaultValue: "Показать архив" })}
            </label>
          </div>

          <section className="room-page-section">
            <h2>
              {t("rooms.listTitle", { defaultValue: "Список кабинетов" })}
              <span className="room-page-count">{filtered.length}</span>
            </h2>

            {filtered.length === 0 ? (
              <div className="room-page-empty">
                <p>
                  {t("rooms.empty", { defaultValue: "Кабинетов пока нет" })}
                </p>
                {canManage && (
                  <button
                    className="room-page-btn-primary"
                    onClick={openCreate}
                    type="button"
                  >
                    {t("rooms.createFirst", {
                      defaultValue: "Создать первый кабинет",
                    })}
                  </button>
                )}
              </div>
            ) : (
              <div className="room-page-groups">
                {grouped.map(({ dept, rooms: deptRooms }) => (
                  <div
                    className="room-group"
                    key={dept?._id || dept?.id || "unknown"}
                  >
                    <div className="room-group-title">
                      {dept?.name ||
                        t("rooms.unknownDepartment", {
                          defaultValue: "Без отделения",
                        })}
                      <span className="room-group-count">
                        {deptRooms.length}
                      </span>
                    </div>
                    <div className="room-page-list">
                      {deptRooms.map((room) => (
                        <RoomRow
                          key={room._id || room.id}
                          room={room}
                          canManage={canManage}
                          onEdit={openEdit}
                          onArchive={handleArchive}
                          onRestore={handleRestore}
                          isLoading={actionLoading[room._id || room.id]}
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
        <RoomFormModal
          room={editing}
          departments={activeDepartments}
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

function RoomRow({
  room,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  isLoading,
  t,
}) {
  const archived = room.status === "archived";
  const assignedCount = Array.isArray(room.assignedMembershipIds)
    ? room.assignedMembershipIds.length
    : 0;

  return (
    <div
      className={`room-row ${archived ? "is-archived" : ""} ${
        isLoading ? "is-loading" : ""
      }`}
    >
      <div className="room-row-main">
        <div className="room-row-name">
          {room.name}
          {archived && (
            <span className="room-row-archived-badge">
              {t("rooms.archivedBadge", { defaultValue: "архив" })}
            </span>
          )}
        </div>
        <div className="room-row-meta">
          {room.code && <span className="room-row-code">{room.code}</span>}
          {room.floor && (
            <span className="room-row-floor">
              {t("rooms.floorShort", { defaultValue: "этаж" })} {room.floor}
            </span>
          )}
          {typeof room.capacity === "number" && (
            <span className="room-row-capacity">
              {t("rooms.capacityShort", { defaultValue: "мест" })}:{" "}
              {room.capacity}
            </span>
          )}
          {assignedCount > 0 && (
            <span className="room-row-staff">
              {t("rooms.staffCount", {
                count: assignedCount,
                defaultValue: `врачей: ${assignedCount}`,
              })}
            </span>
          )}
        </div>
      </div>

      {canManage && (
        <div className="room-row-actions">
          {!archived && (
            <button
              className="room-row-btn-edit"
              onClick={() => onEdit(room)}
              disabled={isLoading}
              type="button"
            >
              {t("common.edit", { defaultValue: "Изменить" })}
            </button>
          )}
          {archived ? (
            <button
              className="room-row-btn-restore"
              onClick={() => onRestore(room)}
              disabled={isLoading}
              type="button"
            >
              {t("rooms.restore", { defaultValue: "Восстановить" })}
            </button>
          ) : (
            <button
              className="room-row-btn-archive"
              onClick={() => onArchive(room)}
              disabled={isLoading}
              type="button"
            >
              {t("rooms.archive", { defaultValue: "В архив" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
