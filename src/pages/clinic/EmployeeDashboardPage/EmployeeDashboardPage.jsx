// client/src/pages/clinic/EmployeeDashboardPage/EmployeeDashboardPage.jsx
//
// Icons are lucide-react components (not emoji) so the file stays pure ASCII
// and is immune to editor/terminal encoding corruption.

import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Users,
  Building2,
  DoorOpen,
  Wrench,
  Megaphone,
  BookOpen,
  Pill,
  LayoutTemplate,
  Send,
  Star,
  BarChart3,
  Inbox,
  User,
  Hospital,
  Award,
} from "lucide-react";
import { useClinicPermissions } from "../../../lib/can";
import "./employeeDashboardPage.css";

// Quick actions in the employee zone. Each is gated by a permission
// (resource + action); an action renders ONLY when effective permissions
// grant it. `to` + `soon:false` => live Link; otherwise disabled placeholder.
const QUICK_ACTIONS = [
  // clinical / operational
  {
    key: "schedule",
    Icon: Calendar,
    res: "schedule",
    act: "read",
    soon: false,
    to: "/clinic/employee/schedule",
    labelKey: "employeeDashboard.actions.schedule",
    labelDefault:
      "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
  },
  {
    key: "patients",
    Icon: Users,
    res: "patient",
    act: "read",
    soon: false,
    to: "/clinic/employee/patients",
    labelKey: "employeeDashboard.actions.patients",
    labelDefault: "\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
  },
  {
    key: "departments",
    Icon: Building2,
    res: "department",
    act: "read",
    soon: false,
    to: "/clinic/employee/departments",
    labelKey: "employeeDashboard.actions.departments",
    labelDefault: "\u041E\u0442\u0434\u0435\u043B\u0435\u043D\u0438\u044F",
  },
  {
    key: "rooms",
    Icon: DoorOpen,
    res: "room",
    act: "read",
    soon: false,
    to: "/clinic/employee/rooms",
    labelKey: "employeeDashboard.actions.rooms",
    labelDefault: "\u041A\u0430\u0431\u0438\u043D\u0435\u0442\u044B",
  },
  {
    key: "equipment",
    Icon: Wrench,
    res: "equipment",
    act: "read",
    soon: false,
    to: "/clinic/employee/equipment",
    labelKey: "employeeDashboard.actions.equipment",
    labelDefault:
      "\u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435",
  },
  {
    key: "announcements",
    Icon: Megaphone,
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/announcements",
    labelKey: "employeeDashboard.actions.announcements",
    labelDefault:
      "\u041E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u044F",
  },
  {
    key: "knowledge",
    Icon: BookOpen,
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/knowledge",
    labelKey: "employeeDashboard.actions.knowledge",
    labelDefault:
      "\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439",
  },
  {
    key: "pharmacy",
    Icon: Pill,
    res: "pharmacy",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.pharmacySoon",
    labelDefault:
      "\u0410\u043F\u0442\u0435\u043A\u0430 (\u0441\u043A\u043E\u0440\u043E)",
  },
  // marketing / public site
  {
    key: "vitrina",
    Icon: LayoutTemplate,
    res: "site_builder",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.vitrinaSoon",
    labelDefault:
      "\u0412\u0438\u0442\u0440\u0438\u043D\u0430 (\u0441\u043A\u043E\u0440\u043E)",
  },
  {
    key: "marketing",
    Icon: Send,
    res: "marketing",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.marketingSoon",
    labelDefault:
      "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 (\u0441\u043A\u043E\u0440\u043E)",
  },
  {
    key: "reviews",
    Icon: Star,
    res: "review",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.reviewsSoon",
    labelDefault:
      "\u041E\u0442\u0437\u044B\u0432\u044B (\u0441\u043A\u043E\u0440\u043E)",
  },
  {
    key: "analytics",
    Icon: BarChart3,
    res: "analytics",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.analyticsSoon",
    labelDefault:
      "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 (\u0441\u043A\u043E\u0440\u043E)",
  },
  {
    key: "leads",
    Icon: Inbox,
    res: "lead",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.leadsSoon",
    labelDefault:
      "\u041E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F (\u0441\u043A\u043E\u0440\u043E)",
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
    if (!d) return "\u2014";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "\u2014";
    }
  };

  const tier = clinic?.tier || "starter";
  const roleLabel = t(`roles.${role}`, { defaultValue: role });

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
            clinicName: clinic?.name || "\u2014",
          })}
        </p>
      </header>

      <section className="employee-dashboard-info">
        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">
            <User size={22} />
          </div>
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
          <div className="employee-dashboard-info-icon">
            <Hospital size={22} />
          </div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.clinic")}
            </div>
            <div className="employee-dashboard-info-value">
              {clinic?.name || "\u2014"}
            </div>
            {clinic?.slug && (
              <div className="employee-dashboard-info-sub">/{clinic.slug}</div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">
            <Award size={22} />
          </div>
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
          <div className="employee-dashboard-info-icon">
            <Calendar size={22} />
          </div>
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
                "\u0414\u043B\u044F \u0432\u0430\u0448\u0435\u0439 \u0440\u043E\u043B\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0445 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F\u0445.",
            })}
          </p>
        ) : (
          <>
            <div className="employee-dashboard-actions">
              {visibleActions.map((a) => {
                const label = t(a.labelKey, { defaultValue: a.labelDefault });
                const isLive = a.to && !a.soon;
                const Icon = a.Icon;

                if (isLive) {
                  return (
                    <Link
                      key={a.key}
                      to={a.to}
                      className="employee-dashboard-action"
                    >
                      <span className="employee-dashboard-action-icon">
                        <Icon size={22} />
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
                      <Icon size={22} />
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
