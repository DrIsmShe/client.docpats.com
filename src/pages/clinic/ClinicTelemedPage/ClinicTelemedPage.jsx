// client/src/pages/clinic/ClinicTelemedPage/ClinicTelemedPage.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listTelemed,
  listDepartments,
  listStaff,
  createTelemed,
  updateTelemed,
  cancelTelemed,
} from "../../../api/clinic";
import TelemedFormModal from "./TelemedFormModal";
import JitsiRoom from "../../communication/components/JitsiRoom";
import "./clinicTelemedPage.css";

const STATUSES = ["scheduled", "live", "completed", "cancelled", "no_show"];

export default function ClinicTelemedPage() {
  const { t, i18n } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Видеоприём (Jitsi): id открытой сессии (null = закрыто).
  const [videoSessionId, setVideoSessionId] = useState(null);

  const myRole = layoutContext?.role || "member";
  const canManage = [
    "owner",
    "admin",
    "manager",
    "doctor",
    "receptionist",
  ].includes(myRole);

  // Имя текущего пользователя для подписи в видеокомнате (если доступно).
  const myDisplayName =
    layoutContext?.displayName ||
    [layoutContext?.user?.firstName, layoutContext?.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    layoutContext?.user?.name ||
    undefined;

  const deptMap = useMemo(() => {
    const m = {};
    for (const d of departments) m[String(d._id || d.id)] = d;
    return m;
  }, [departments]);

  const staffByMembership = useMemo(() => {
    const m = {};
    for (const s of staff) {
      const mid = String(s.membershipId || s._id || s.id);
      m[mid] =
        [s.firstName, s.lastName].filter(Boolean).join(" ") ||
        s.email ||
        s.username ||
        "—";
    }
    return m;
  }, [staff]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [sRes, deptsRes, staffRes] = await Promise.all([
        listTelemed({}),
        listDepartments({}).catch(() => ({ items: [] })),
        listStaff().catch(() => ({ items: [] })),
      ]);
      setSessions(sRes.items || []);
      setDepartments(deptsRes.items || []);
      setStaff(staffRes.items || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load telemed sessions:", err);
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message || "Failed to load telemed sessions");
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
    return sessions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return (s.title || "").toLowerCase().includes(q);
    });
  }, [sessions, statusFilter, search]);

  // Upcoming = scheduled/live with scheduledAt in the future (or live now).
  // Past = everything else (completed/cancelled/no_show, or past scheduled).
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up = [];
    const pa = [];
    for (const s of filtered) {
      const ts = new Date(s.scheduledAt).getTime();
      const active = s.status === "scheduled" || s.status === "live";
      if (active && ts >= now - 3600_000) up.push(s);
      else pa.push(s);
    }
    up.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    pa.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    return { upcoming: up, past: pa };
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s) {
    setEditing(s);
    setModalOpen(true);
  }

  // Войти в видеоприём — открывает Jitsi-комнату telemed-<joinKey>.
  const joinVideo = useCallback((s) => {
    setVideoSessionId(String(s._id || s.id));
  }, []);

  async function handleModalSubmit(payload) {
    if (editing) {
      await updateTelemed(editing._id || editing.id, payload);
    } else {
      await createTelemed(payload);
    }
    setModalOpen(false);
    setEditing(null);
    loadAll();
  }

  async function runAction(id, fn) {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await fn();
      await loadAll();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("telemed.actionFailed", { defaultValue: "Не удалось выполнить" }),
      );
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  const setStatus = (s, status) =>
    runAction(s._id || s.id, () => updateTelemed(s._id || s.id, { status }));

  const doCancel = (s) => {
    if (
      !window.confirm(
        t("telemed.confirmCancel", {
          name: s.title,
          defaultValue: `Отменить приём «${s.title}»?`,
        }),
      )
    )
      return;
    runAction(s._id || s.id, () => cancelTelemed(s._id || s.id));
  };

  if (loading) {
    return (
      <div className="tm-page-loading">
        <div className="tm-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="tm-page-error">
        <h2>{t("telemed.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <button onClick={loadAll}>
          {t("common.retry", { defaultValue: "Повторить" })}
        </button>
      </div>
    );
  }

  return (
    <div className="tm-page">
      <div className="tm-page-header">
        <div className="tm-page-header-left">
          <Link to="/clinic/dashboard" className="tm-page-back">
            {t("telemed.back", { defaultValue: "← Дашборд" })}
          </Link>
          <h1>{t("telemed.title", { defaultValue: "Телемедицина" })}</h1>
          <p className="tm-page-subtitle">
            {t("telemed.subtitle", {
              defaultValue: "Виртуальные приёмы клиники",
            })}
          </p>
        </div>
        {canManage && (
          <div className="tm-page-header-actions">
            <button
              className="tm-page-btn-primary"
              onClick={openCreate}
              type="button"
            >
              {t("telemed.create", { defaultValue: "Запланировать приём" })}
            </button>
          </div>
        )}
      </div>

      <div className="tm-page-toolbar">
        <input
          className="tm-page-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("telemed.searchPlaceholder", {
            defaultValue: "Поиск по теме…",
          })}
        />
        <select
          className="tm-page-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">
            {t("telemed.allStatuses", { defaultValue: "Все статусы" })}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`telemed.status.${s}`, { defaultValue: s })}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="tm-page-empty">
          <p>{t("telemed.empty", { defaultValue: "Приёмов пока нет" })}</p>
          {canManage && (
            <button
              className="tm-page-btn-primary"
              onClick={openCreate}
              type="button"
            >
              {t("telemed.createFirst", {
                defaultValue: "Запланировать первый приём",
              })}
            </button>
          )}
        </div>
      ) : (
        <>
          <Section
            title={t("telemed.upcoming", { defaultValue: "Предстоящие" })}
            count={upcoming.length}
            items={upcoming}
            empty={t("telemed.noUpcoming", {
              defaultValue: "Нет предстоящих приёмов",
            })}
            {...{
              deptMap,
              staffByMembership,
              canManage,
              actionLoading,
              i18n,
              t,
              joinVideo,
              setStatus,
              doCancel,
              openEdit,
            }}
          />
          {past.length > 0 && (
            <Section
              title={t("telemed.past", { defaultValue: "Прошедшие" })}
              count={past.length}
              items={past}
              {...{
                deptMap,
                staffByMembership,
                canManage,
                actionLoading,
                i18n,
                t,
                joinVideo,
                setStatus,
                doCancel,
                openEdit,
              }}
            />
          )}
        </>
      )}

      {modalOpen && (
        <TelemedFormModal
          session={editing}
          departments={activeDepartments}
          staff={staff}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Видеоприём (Jitsi, оверлей) */}
      {videoSessionId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setVideoSessionId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 960,
              height: "80vh",
              maxHeight: 720,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <JitsiRoom
              source="telemed"
              id={videoSessionId}
              displayName={myDisplayName}
              onClose={() => setVideoSessionId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  items,
  empty,
  deptMap,
  staffByMembership,
  canManage,
  actionLoading,
  i18n,
  t,
  joinVideo,
  setStatus,
  doCancel,
  openEdit,
}) {
  return (
    <section className="tm-section">
      <h2>
        {title}
        <span className="tm-count">{count}</span>
      </h2>
      {items.length === 0 ? (
        <div className="tm-section-empty">{empty}</div>
      ) : (
        <div className="tm-list">
          {items.map((s) => (
            <SessionRow
              key={s._id || s.id}
              session={s}
              deptMap={deptMap}
              staffByMembership={staffByMembership}
              canManage={canManage}
              isLoading={actionLoading[s._id || s.id]}
              i18n={i18n}
              t={t}
              joinVideo={joinVideo}
              setStatus={setStatus}
              doCancel={doCancel}
              openEdit={openEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SessionRow({
  session: s,
  deptMap,
  staffByMembership,
  canManage,
  isLoading,
  i18n,
  t,
  joinVideo,
  setStatus,
  doCancel,
  openEdit,
}) {
  const deptName = s.departmentId
    ? deptMap[String(s.departmentId)]?.name
    : null;
  const hostName = s.hostMembershipId
    ? staffByMembership[String(s.hostMembershipId)]
    : null;

  const when = (() => {
    try {
      return new Date(s.scheduledAt).toLocaleString(
        i18n.language || undefined,
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      );
    } catch {
      return "";
    }
  })();

  const terminal = ["completed", "cancelled", "no_show"].includes(s.status);
  const canJoin = s.status === "scheduled" || s.status === "live";

  return (
    <div
      className={`tm-row ${terminal ? "is-terminal" : ""} ${isLoading ? "is-loading" : ""}`}
    >
      <div className="tm-row-main">
        <div className="tm-row-title">
          {s.title}
          <span className={`tm-status-badge status-${s.status}`}>
            {t(`telemed.status.${s.status}`, { defaultValue: s.status })}
          </span>
        </div>
        <div className="tm-row-meta">
          <span className="tm-row-when">🕒 {when}</span>
          <span>
            ⏱ {s.durationMinutes} {t("telemed.min", { defaultValue: "мин" })}
          </span>
          {hostName && <span>🩺 {hostName}</span>}
          {deptName && <span>🏥 {deptName}</span>}
          {s.patientId && (
            <span>
              👤 {t("telemed.hasPatient", { defaultValue: "пациент" })}
            </span>
          )}
        </div>
      </div>

      <div className="tm-row-actions">
        {canJoin && (
          <button
            className="tm-btn-join"
            onClick={() => joinVideo(s)}
            type="button"
            disabled={isLoading}
          >
            🎥 {t("telemed.join", { defaultValue: "Войти" })}
          </button>
        )}
        {canManage && s.status === "scheduled" && (
          <button
            className="tm-btn"
            onClick={() => setStatus(s, "live")}
            type="button"
            disabled={isLoading}
          >
            {t("telemed.start", { defaultValue: "Начать" })}
          </button>
        )}
        {canManage && s.status === "live" && (
          <button
            className="tm-btn"
            onClick={() => setStatus(s, "completed")}
            type="button"
            disabled={isLoading}
          >
            {t("telemed.complete", { defaultValue: "Завершить" })}
          </button>
        )}
        {canManage && s.status === "scheduled" && (
          <button
            className="tm-btn"
            onClick={() => setStatus(s, "no_show")}
            type="button"
            disabled={isLoading}
          >
            {t("telemed.noShow", { defaultValue: "Неявка" })}
          </button>
        )}
        {canManage && !terminal && (
          <>
            <button
              className="tm-btn"
              onClick={() => openEdit(s)}
              type="button"
              disabled={isLoading}
            >
              {t("common.edit", { defaultValue: "Изменить" })}
            </button>
            <button
              className="tm-btn is-danger"
              onClick={() => doCancel(s)}
              type="button"
              disabled={isLoading}
            >
              {t("telemed.cancel", { defaultValue: "Отменить" })}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
