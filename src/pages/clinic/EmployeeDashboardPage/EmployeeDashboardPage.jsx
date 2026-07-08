// client/src/pages/clinic/EmployeeDashboardPage/EmployeeDashboardPage.jsx
//
// NOTE: all emoji are written as \uXXXX escape sequences (pure ASCII) so the
// file is immune to editor/terminal encoding corruption. JS resolves them to
// the real glyphs at runtime.

import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar, Users, Building2, DoorOpen, Wrench, Megaphone, BookOpen, Pill,
  LayoutTemplate, Send, Star, BarChart3, Inbox, User, Hospital, Award,
} from "lucide-react";import { useClinicPermissions } from "../../../lib/can";
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
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.scheduleSoon",
    labelDefault: "Р В Р В°РЎРѓР С—Р С‘РЎРѓР В°Р Р…Р С‘Р Вµ (РЎРѓР С”Р С•РЎР‚Р С•)",
  },
  {
    key: "patients",
    Icon: Users,
    res: "patient",
    act: "read",
    soon: false,
    to: "/clinic/employee/patients",
    labelKey: "employeeDashboard.actions.patients",
    labelDefault: "Р СџР В°РЎвЂ Р С‘Р ВµР Р…РЎвЂљРЎвЂ№",
  },
  {
    key: "departments",
    Icon: Building2,
    res: "department",
    act: "read",
    soon: false,
    to: "/clinic/employee/departments",
    labelKey: "employeeDashboard.actions.departments",
    labelDefault: "Р С›РЎвЂљР Т‘Р ВµР В»Р ВµР Р…Р С‘РЎРЏ",
  },
  {
    key: "rooms",
    Icon: DoorOpen,
    res: "room",
    act: "read",
    soon: false,
    to: "/clinic/employee/rooms",
    labelKey: "employeeDashboard.actions.rooms",
    labelDefault: "Р С™Р В°Р В±Р С‘Р Р…Р ВµРЎвЂљРЎвЂ№",
  },
  {
    key: "equipment",
    Icon: Wrench,
    res: "equipment",
    act: "read",
    soon: false,
    to: "/clinic/employee/equipment",
    labelKey: "employeeDashboard.actions.equipment",
    labelDefault: "Р С›Р В±Р С•РЎР‚РЎС“Р Т‘Р С•Р Р†Р В°Р Р…Р С‘Р Вµ",
  },
  {
    key: "announcements",
    Icon: Megaphone,
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/announcements",
    labelKey: "employeeDashboard.actions.announcements",
    labelDefault: "Р С›Р В±РЎР‰РЎРЏР Р†Р В»Р ВµР Р…Р С‘РЎРЏ",
  },
  {
    key: "knowledge",
    Icon: BookOpen,
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/knowledge",
    labelKey: "employeeDashboard.actions.knowledge",
    labelDefault: "Р вЂР В°Р В·Р В° Р В·Р Р…Р В°Р Р…Р С‘Р в„–",
  },
  {
    key: "pharmacy",
    Icon: Pill,
    res: "pharmacy",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.pharmacySoon",
    labelDefault: "Р С’Р С—РЎвЂљР ВµР С”Р В° (РЎРѓР С”Р С•РЎР‚Р С•)",
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
    labelDefault: "Р вЂ™Р С‘РЎвЂљРЎР‚Р С‘Р Р…Р В° (РЎРѓР С”Р С•РЎР‚Р С•)",
  },
  {
    key: "marketing",
    Icon: Send,
    res: "marketing",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.marketingSoon",
    labelDefault: "Р СџРЎС“Р В±Р В»Р С‘Р С”Р В°РЎвЂ Р С‘Р С‘ (РЎРѓР С”Р С•РЎР‚Р С•)",
  },
  {
    key: "reviews",
    Icon: Star,
    res: "review",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.reviewsSoon",
    labelDefault: "Р С›РЎвЂљР В·РЎвЂ№Р Р†РЎвЂ№ (РЎРѓР С”Р С•РЎР‚Р С•)",
  },
  {
    key: "analytics",
    Icon: BarChart3,
    res: "analytics",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.analyticsSoon",
    labelDefault: "Р С’Р Р…Р В°Р В»Р С‘РЎвЂљР С‘Р С”Р В° (РЎРѓР С”Р С•РЎР‚Р С•)",
  },
  {
    key: "leads",
    Icon: Inbox,
    res: "lead",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.leadsSoon",
    labelDefault: "Р С›Р В±РЎР‚Р В°РЎвЂ°Р ВµР Р…Р С‘РЎРЏ (РЎРѓР С”Р С•РЎР‚Р С•)",
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
    if (!d) return "РІР‚вЂќ";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "РІР‚вЂќ";
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
            clinicName: clinic?.name || "РІР‚вЂќ",
          })}
        </p>
      </header>

      <section className="employee-dashboard-info">
        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon"><User size={22} /></div>
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
          <div className="employee-dashboard-info-icon"><Hospital size={22} /></div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.clinic")}
            </div>
            <div className="employee-dashboard-info-value">
              {clinic?.name || "РІР‚вЂќ"}
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
          <div className="employee-dashboard-info-icon"><Calendar size={22} /></div>
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
                "Р вЂќР В»РЎРЏ Р Р†Р В°РЎв‚¬Р ВµР в„– РЎР‚Р С•Р В»Р С‘ Р Т‘Р ВµР в„–РЎРѓРЎвЂљР Р†Р С‘РЎРЏ Р С—Р С•РЎРЏР Р†РЎРЏРЎвЂљРЎРѓРЎРЏ Р Р† РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р С‘РЎвЂ¦ Р С•Р В±Р Р…Р С•Р Р†Р В»Р ВµР Р…Р С‘РЎРЏРЎвЂ¦.",
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
