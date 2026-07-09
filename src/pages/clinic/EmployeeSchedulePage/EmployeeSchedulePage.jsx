// client/src/pages/clinic/EmployeeSchedulePage/EmployeeSchedulePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, CalendarDays, Search } from "lucide-react";
import { useClinicZone } from "../../../lib/useClinicZone";
import { listStaff } from "../../../api/clinic";
import "./employeeSchedulePage.css";

const SCHEDULABLE_ROLES = ["doctor", "owner", "admin"];

export default function EmployeeSchedulePage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const { basePath, dashboardPath, loginPath } = useClinicZone();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listStaff();
      setStaff(res.items || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(loginPath, { replace: true });
        return;
      }
      setError(
        err.response?.data?.error ||
          t("schedule.loadError", { defaultValue: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A" }),
      );
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, loginPath]);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = (m) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
    m.email ||
    m.username ||
    t("staff.unnamed", { defaultValue: "\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438" });

  const idOf = (m) => String(m.userId || m._id || m.id || "");

  const doctors = staff.filter((m) => SCHEDULABLE_ROLES.includes(m.role));

  const filtered = doctors.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      nameOf(m).toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.specialization || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="emp-sched-loading">
        <div className="emp-sched-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="emp-sched-error">
        <h2>{t("schedule.title", { defaultValue: "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435" })}</h2>
        <p>{error}</p>
        <button onClick={load} type="button">
          {t("schedule.retry", { defaultValue: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })}
        </button>
      </div>
    );
  }

  return (
    <div className="emp-sched-page">
      <div className="emp-sched-header">
        <Link to={dashboardPath} className="emp-sched-back">
          {t("schedule.backToDashboard", { defaultValue: "\u2190 \u0414\u0430\u0448\u0431\u043E\u0440\u0434" })}
        </Link>
        <h1 className="emp-sched-title">
          {t("schedule.pickerTitle", { defaultValue: "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0432\u0440\u0430\u0447\u0435\u0439" })}
        </h1>
        <p className="emp-sched-subtitle">
          {t("schedule.pickerSubtitle", {
            defaultValue: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0440\u0430\u0447\u0430: \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u043D\u0430 \u0434\u0435\u043D\u044C",
          })}
        </p>
      </div>

      <div className="emp-sched-toolbar">
        <div className="emp-sched-search-wrap">
          <Search size={16} className="emp-sched-search-icon" />
          <input
            className="emp-sched-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("schedule.pickerSearch", {
              defaultValue: "\u041F\u043E\u0438\u0441\u043A \u0432\u0440\u0430\u0447\u0430...",
            })}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="emp-sched-empty">
          {t("schedule.pickerEmpty", {
            defaultValue: "\u0412\u0440\u0430\u0447\u0435\u0439 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E",
          })}
        </div>
      ) : (
        <div className="emp-sched-list">
          {filtered.map((m) => {
            const id = idOf(m);
            const role = t(`roles.${m.role}`, { defaultValue: m.role });
            return (
              <div key={id} className="emp-sched-row">
                <span className="emp-sched-row-main">
                  <span className="emp-sched-row-name">{nameOf(m)}</span>
                  <span className="emp-sched-row-meta">
                    {m.specialization ? `${m.specialization} \u00B7 ` : ""}
                    {role}
                  </span>
                </span>
                <span className="emp-sched-row-actions">
                  <Link to={`${basePath}/schedule/${id}`} className="emp-sched-action">
                    <CalendarClock size={16} />
                    {t("schedule.openSchedule", { defaultValue: "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435" })}
                  </Link>
                  <Link to={`${basePath}/schedule/${id}/calendar`} className="emp-sched-action emp-sched-action-queue">
                    <CalendarDays size={16} />
                    {t("schedule.openQueue", { defaultValue: "\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u0434\u043D\u044F" })}
                  </Link>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}