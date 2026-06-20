// client/src/pages/clinic/ClinicConsiliumPage/ClinicConsiliumPage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listConsilia,
  listDepartments,
  listStaff,
  createConsilium,
} from "../../../api/clinic";
import ConsiliumFormModal from "./ConsiliumFormModal";
import "./clinicConsiliumPage.css";

const STATUS_ORDER = ["open", "resolved", "archived"];

export default function ClinicConsiliumPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consilia, setConsilia] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const myRole = layoutContext?.role || "member";
  // Doctors may also create + participate (not only owner/admin/manager).
  const canCreate = ["owner", "admin", "manager", "doctor"].includes(myRole);

  const deptMap = useMemo(() => {
    const m = {};
    for (const d of departments) m[String(d._id || d.id)] = d;
    return m;
  }, [departments]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [cRes, deptsRes, staffRes] = await Promise.all([
        listConsilia({}),
        listDepartments({}).catch(() => ({ items: [] })),
        listStaff().catch(() => ({ items: [] })),
      ]);
      setConsilia(cRes.items || []);
      setDepartments(deptsRes.items || []);
      setStaff(staffRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load consilia:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load consilia");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === "active"),
    [departments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return consilia.filter((c) => {
      if (!showArchived && c.status === "archived") return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [consilia, showArchived, statusFilter, search]);

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const c of filtered) {
      const key = c.status || "open";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
    return STATUS_ORDER.filter((s) => groups.has(s)).map((s) => ({
      status: s,
      items: groups.get(s),
    }));
  }, [filtered]);

  async function handleCreate(payload) {
    const res = await createConsilium(payload);
    setModalOpen(false);
    const id = res.consilium?._id || res.consilium?.id;
    if (id) navigate(`/clinic/consilia/${id}`);
    else loadAll();
  }

  if (loading) {
    return (
      <div className="cons-page-loading">
        <div className="cons-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cons-page-error">
        <h2>{t("consilium.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  return (
    <div className="cons-page">
      <div className="cons-page-header">
        <div className="cons-page-header-left">
          <Link to="/clinic/dashboard" className="cons-page-back">
            {t("consilium.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("consilium.title", { defaultValue: "Консилиумы" })}</h1>
          <p className="cons-page-subtitle">
            {t("consilium.subtitle", {
              defaultValue: "Совместное обсуждение клинических случаев",
            })}
          </p>
        </div>
        {canCreate && (
          <div className="cons-page-header-actions">
            <button
              className="cons-page-btn-primary"
              onClick={() => setModalOpen(true)}
              type="button"
            >
              {t("consilium.create", { defaultValue: "Новый консилиум" })}
            </button>
          </div>
        )}
      </div>

      <div className="cons-page-toolbar">
        <input
          className="cons-page-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("consilium.searchPlaceholder", {
            defaultValue: "Поиск по теме…",
          })}
        />
        <select
          className="cons-page-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">
            {t("consilium.allStatuses", { defaultValue: "Все статусы" })}
          </option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`consilium.status.${s}`, { defaultValue: s })}
            </option>
          ))}
        </select>
        <label className="cons-page-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t("consilium.showArchived", { defaultValue: "Архив" })}
        </label>
      </div>

      <section className="cons-page-section">
        <h2>
          {t("consilium.listTitle", { defaultValue: "Список" })}
          <span className="cons-page-count">{filtered.length}</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="cons-page-empty">
            <p>
              {t("consilium.empty", { defaultValue: "Консилиумов пока нет" })}
            </p>
            {canCreate && (
              <button
                className="cons-page-btn-primary"
                onClick={() => setModalOpen(true)}
                type="button"
              >
                {t("consilium.createFirst", {
                  defaultValue: "Создать первый консилиум",
                })}
              </button>
            )}
          </div>
        ) : (
          <div className="cons-page-groups">
            {grouped.map(({ status, items }) => (
              <div className="cons-group" key={status}>
                <div className="cons-group-title">
                  {t(`consilium.status.${status}`, { defaultValue: status })}
                  <span className="cons-group-count">{items.length}</span>
                </div>
                <div className="cons-page-list">
                  {items.map((c) => (
                    <ConsiliumCard
                      key={c._id || c.id}
                      consilium={c}
                      deptMap={deptMap}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <ConsiliumFormModal
          departments={activeDepartments}
          staff={staff}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function ConsiliumCard({ consilium, deptMap, t }) {
  const archived = consilium.status === "archived";
  const deptName = consilium.departmentId
    ? deptMap[String(consilium.departmentId)]?.name
    : null;
  const participants = Array.isArray(consilium.participantMembershipIds)
    ? consilium.participantMembershipIds.length
    : 0;

  return (
    <Link
      to={`/clinic/consilia/${consilium._id || consilium.id}`}
      className={`cons-card ${archived ? "is-archived" : ""}`}
    >
      <div className="cons-card-main">
        <div className="cons-card-title">
          {consilium.title}
          <span className={`cons-status-badge status-${consilium.status}`}>
            {t(`consilium.status.${consilium.status}`, {
              defaultValue: consilium.status,
            })}
          </span>
        </div>
        {consilium.description && (
          <div className="cons-card-desc">{consilium.description}</div>
        )}
        <div className="cons-card-meta">
          {deptName && <span>🏥 {deptName}</span>}
          {consilium.patientId && (
            <span>
              👤 {t("consilium.hasPatient", { defaultValue: "пациент" })}
            </span>
          )}
          {participants > 0 && (
            <span>
              👥{" "}
              {t("consilium.participantsCount", {
                count: participants,
                defaultValue: `участников: ${participants}`,
              })}
            </span>
          )}
          {consilium.messageCount > 0 && (
            <span>💬 {consilium.messageCount}</span>
          )}
        </div>
      </div>
      <span className="cons-card-arrow">→</span>
    </Link>
  );
}
