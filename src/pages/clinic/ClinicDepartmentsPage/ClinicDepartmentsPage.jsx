// client/src/pages/clinic/ClinicDepartmentsPage/ClinicDepartmentsPage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listDepartments,
  archiveDepartment,
  updateDepartment,
} from "../../../api/clinic";
import DepartmentFormModal from "./DepartmentFormModal";
import "./clinicDepartmentsPage.css";

export default function ClinicDepartmentsPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, dept = edit

  const myRole = layoutContext?.role || "member";
  const canManage = ["owner", "admin"].includes(myRole);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      // No status filter → backend returns active + archived; otherwise active only.
      const res = await listDepartments(
        showArchived ? {} : { status: "active" },
      );
      setDepartments(res.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load departments:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load departments");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, showArchived]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Client-side filter over the already-loaded list (server search also exists).
  const filtered = departments.filter((d) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.code || "").toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(dep) {
    setEditing(dep);
    setModalOpen(true);
  }

  function handleModalSuccess() {
    setModalOpen(false);
    setEditing(null);
    loadAll();
  }

  async function handleArchive(dep) {
    if (dep.isSystem) {
      alert(
        t("departments.cannotArchiveSystem", {
          defaultValue: "Системное отделение нельзя архивировать",
        }),
      );
      return;
    }
    if (
      !window.confirm(
        t("departments.confirmArchive", {
          name: dep.name,
          defaultValue: `Архивировать «${dep.name}»?`,
        }),
      )
    )
      return;

    const id = dep._id || dep.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await archiveDepartment(id);
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("departments.archiveFailed", {
            defaultValue: "Не удалось архивировать отделение",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleRestore(dep) {
    const id = dep._id || dep.id;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await updateDepartment(id, { status: "active" });
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("departments.restoreFailed", {
            defaultValue: "Не удалось восстановить отделение",
          }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="dept-page-loading">
        <div className="dept-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dept-page-error">
        <h2>{t("departments.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  return (
    <div className="dept-page">
      <div className="dept-page-header">
        <div className="dept-page-header-left">
          <Link to="/clinic/dashboard" className="dept-page-back">
            {t("departments.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("departments.title", { defaultValue: "Отделения" })}</h1>
          <p className="dept-page-subtitle">
            {t("departments.subtitle", {
              defaultValue: "Структура клиники по отделениям",
            })}
          </p>
        </div>
        {canManage && (
          <div className="dept-page-header-actions">
            <button
              className="dept-page-btn-primary"
              onClick={openCreate}
              type="button"
            >
              {t("departments.create", { defaultValue: "Создать отделение" })}
            </button>
          </div>
        )}
      </div>

      <div className="dept-page-toolbar">
        <input
          className="dept-page-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("departments.searchPlaceholder", {
            defaultValue: "Поиск по названию или коду…",
          })}
        />
        <label className="dept-page-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t("departments.showArchived", { defaultValue: "Показать архив" })}
        </label>
      </div>

      <section className="dept-page-section">
        <h2>
          {t("departments.listTitle", { defaultValue: "Список отделений" })}
          <span className="dept-page-count">{filtered.length}</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="dept-page-empty">
            <p>
              {t("departments.empty", {
                defaultValue: "Отделений пока нет",
              })}
            </p>
            {canManage && (
              <button
                className="dept-page-btn-primary"
                onClick={openCreate}
                type="button"
              >
                {t("departments.createFirst", {
                  defaultValue: "Создать первое отделение",
                })}
              </button>
            )}
          </div>
        ) : (
          <div className="dept-page-list">
            {filtered.map((dep) => (
              <DepartmentRow
                key={dep._id || dep.id}
                dep={dep}
                canManage={canManage}
                onEdit={openEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                isLoading={actionLoading[dep._id || dep.id]}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <DepartmentFormModal
          department={editing}
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

function DepartmentRow({
  dep,
  canManage,
  onEdit,
  onArchive,
  onRestore,
  isLoading,
  t,
}) {
  const archived = dep.status === "archived";
  const specialtyLabel = t(`departments.specialty.${dep.specialty}`, {
    defaultValue: dep.specialty,
  });

  return (
    <div
      className={`dept-row ${archived ? "is-archived" : ""} ${
        isLoading ? "is-loading" : ""
      }`}
    >
      <div className="dept-row-main">
        <div className="dept-row-name">
          {dep.name}
          {dep.isSystem && (
            <span className="dept-row-system-badge">
              {t("departments.systemBadge", { defaultValue: "системное" })}
            </span>
          )}
          {archived && (
            <span className="dept-row-archived-badge">
              {t("departments.archivedBadge", { defaultValue: "архив" })}
            </span>
          )}
        </div>
        <div className="dept-row-meta">
          {dep.code && <span className="dept-row-code">{dep.code}</span>}
          <span className="dept-row-specialty">{specialtyLabel}</span>
        </div>
      </div>

      {canManage && (
        <div className="dept-row-actions">
          {!archived && (
            <button
              className="dept-row-btn-edit"
              onClick={() => onEdit(dep)}
              disabled={isLoading}
              type="button"
            >
              {t("common.edit", { defaultValue: "Изменить" })}
            </button>
          )}
          {archived ? (
            <button
              className="dept-row-btn-restore"
              onClick={() => onRestore(dep)}
              disabled={isLoading}
              type="button"
            >
              {t("departments.restore", { defaultValue: "Восстановить" })}
            </button>
          ) : (
            !dep.isSystem && (
              <button
                className="dept-row-btn-archive"
                onClick={() => onArchive(dep)}
                disabled={isLoading}
                type="button"
              >
                {t("departments.archive", { defaultValue: "В архив" })}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
