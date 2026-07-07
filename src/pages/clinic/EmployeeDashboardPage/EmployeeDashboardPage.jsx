// client/src/pages/clinic/EmployeeDashboardPage/EmployeeDashboardPage.jsx

import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicPermissions } from "../../../lib/can";
import "./employeeDashboardPage.css";

// Quick actions available in the employee zone.
// Each is gated by a permission (resource + action); an action is rendered
// ONLY when the current user's effective permissions grant it. This makes the
// dashboard role-aware for every role (marketer, receptionist, nurse, ...)
// without any hardcoded role arrays.
//
//   - `to`   present + `soon:false` → live <Link>
//   - `soon:true` (or no `to`)      → disabled "(coming soon)" placeholder
//
// As pages ship in later phases, flip `soon` to false and set `to`.
const QUICK_ACTIONS = [
  // ── clinical ──
  {
    key: "schedule",
    icon: "📅",
    res: "schedule",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.scheduleSoon",
    labelDefault: "Расписание (скоро)",
  },
  {
    key: "patients",
    icon: "👥",
    res: "patient",
    act: "read",
    soon: false,
    to: "/clinic/employee/patients",
    labelKey: "employeeDashboard.actions.patients",
    labelDefault: "Пациенты",
  },
  {
    key: "pharmacy",
    icon: "💊",
    res: "pharmacy",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.pharmacySoon",
    labelDefault: "Аптека (скоро)",
  },
  // ── marketing / public site ──
  {
    key: "vitrina",
    icon: "🖼️",
    res: "site_builder",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.vitrinaSoon",
    labelDefault: "Витрина (скоро)",
  },
  {
    key: "marketing",
    icon: "📣",
    res: "marketing",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.marketingSoon",
    labelDefault: "Публикации (скоро)",
  },
  {
    key: "reviews",
    icon: "⭐",
    res: "review",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.reviewsSoon",
    labelDefault: "Отзывы (скоро)",
  },
  {
    key: "analytics",
    icon: "📊",
    res: "analytics",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.analyticsSoon",
    labelDefault: "Аналитика (скоро)",
  },
  {
    key: "leads",
    icon: "📨",
    res: "lead",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.leadsSoon",
    labelDefault: "Обращения (скоро)",
  },
];

export default function EmployeeDashboardPage() {
  const { t, i18n } = useTranslation("clinic");
  const ctx = useOutletContext();
  const { can } = useClinicPermissions();

  if (!ctx || ctx.kind !== "employee") {
    return null;
  }

  const { employee, clinic, role } = ctx;
  const fullName =
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
    employee?.email ||
    t("staff.unnamed");

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "—";
    }
  };

  const tier = clinic?.tier || "starter";
  const roleLabel = t(`roles.${role}`, { defaultValue: role });

  // Only show actions the current user is actually allowed to use.
  const visibleActions = QUICK_ACTIONS.filter((a) => can(a.res, a.act));

  return (
    <div className="employee-dashboard">
      <header className="employee-dashboard-header">
        <h1>
          {t("employeeDashboard.welcome", {
            name: employee?.firstName || fullName,
          })}
        </h1>
        <p className="employee-dashboard-subtitle">
          {t("employeeDashboard.subtitle", {
            clinicName: clinic?.name || "—",
          })}
        </p>
      </header>

      <section className="employee-dashboard-info">
        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">👤</div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.fullName")}
            </div>
            <div className="employee-dashboard-info-value">{fullName}</div>
            {employee?.email && (
              <div className="employee-dashboard-info-sub">
                {employee.email}
              </div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">🏥</div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.clinic")}
            </div>
            <div className="employee-dashboard-info-value">
              {clinic?.name || "—"}
            </div>
            {clinic?.slug && (
              <div className="employee-dashboard-info-sub">/{clinic.slug}</div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">🎖️</div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.role")}
            </div>
            <div className="employee-dashboard-info-value">
              <span className={`employee-dashboard-role-badge role-${role}`}>
                {roleLabel}
              </span>
            </div>
            {employee?.customTitle && (
              <div className="employee-dashboard-info-sub">
                {employee.customTitle}
              </div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">📅</div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.joinedAt")}
            </div>
            <div className="employee-dashboard-info-value">
              {formatDate(employee?.joinedAt)}
            </div>
            <div className="employee-dashboard-info-sub">
              {t(`tiers.${tier}`, { defaultValue: tier })}
            </div>
          </div>
        </div>
      </section>

      <section className="employee-dashboard-section">
        <h2>{t("employeeDashboard.quickActions")}</h2>

        {visibleActions.length === 0 ? (
          <p className="employee-dashboard-coming-soon">
            {t("employeeDashboard.noActions", {
              defaultValue:
                "Для вашей роли действия появятся в следующих обновлениях.",
            })}
          </p>
        ) : (
          <>
            <div className="employee-dashboard-actions">
              {visibleActions.map((a) => {
                const label = t(a.labelKey, { defaultValue: a.labelDefault });
                const isLive = a.to && !a.soon;

                if (isLive) {
                  return (
                    <Link
                      key={a.key}
                      to={a.to}
                      className="employee-dashboard-action"
                    >
                      <span className="employee-dashboard-action-icon">
                        {a.icon}
                      </span>
                      <span className="employee-dashboard-action-label">
                        {label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={a.key}
                    className="employee-dashboard-action employee-dashboard-action-disabled"
                    disabled
                  >
                    <span className="employee-dashboard-action-icon">
                      {a.icon}
                    </span>
                    <span className="employee-dashboard-action-label">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="employee-dashboard-coming-soon">
              {t("employeeDashboard.comingSoon")}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
