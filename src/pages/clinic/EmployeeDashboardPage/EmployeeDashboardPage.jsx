// client/src/pages/clinic/EmployeeDashboardPage/EmployeeDashboardPage.jsx

import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClinicPermissions } from "../../../lib/can";
import "./employeeDashboardPage.css";

// Quick actions available in the employee zone.
// Each is gated by a permission (resource + action); an action is rendered
// ONLY when the current user's effective permissions grant it. This makes the
// dashboard role-aware for every role (marketer, receptionist, nurse, manager)
// without any hardcoded role arrays.
//
//   - `to`   present + `soon:false` в†’ live <Link>
//   - `soon:true` (or no `to`)      в†’ disabled "(coming soon)" placeholder
//
// As pages ship in later phases, flip `soon` to false and set `to`.
const QUICK_ACTIONS = [
  {
    key: "departments",
    icon: "\uD83C\uDFE2",
    res: "department",
    act: "read",
    soon: false,
    to: "/clinic/employee/departments",
    labelKey: "employeeDashboard.actions.departments",
    labelDefault: "Отделения",
  },
  {
    key: "rooms",
    icon: "\uD83D\uDEAA",
    res: "room",
    act: "read",
    soon: false,
    to: "/clinic/employee/rooms",
    labelKey: "employeeDashboard.actions.rooms",
    labelDefault: "Кабинеты",
  },
  {
    key: "equipment",
    icon: "\uD83D\uDD27",
    res: "equipment",
    act: "read",
    soon: false,
    to: "/clinic/employee/equipment",
    labelKey: "employeeDashboard.actions.equipment",
    labelDefault: "Оборудование",
  },
  {
    key: "announcements",
    icon: "\uD83D\uDCE2",
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/announcements",
    labelKey: "employeeDashboard.actions.announcements",
    labelDefault: "Объявления",
  },
  {
    key: "knowledge",
    icon: "\uD83D\uDCDA",
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/knowledge",
    labelKey: "employeeDashboard.actions.knowledge",
    labelDefault: "База знаний",
  },
  // в”Ђв”Ђ clinical / operational в”Ђв”Ђ
  {
    key: "schedule",
    icon: "рџ“…",
    res: "schedule",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.scheduleSoon",
    labelDefault: "Р Р°СЃРїРёСЃР°РЅРёРµ (СЃРєРѕСЂРѕ)",
  },
  {
    key: "patients",
    icon: "рџ‘Ґ",
    res: "patient",
    act: "read",
    soon: false,
    to: "/clinic/employee/patients",
    labelKey: "employeeDashboard.actions.patients",
    labelDefault: "РџР°С†РёРµРЅС‚С‹",
  },
  {
    key: "departments",
    icon: "рџЏў",
    res: "department",
    act: "read",
    soon: false,
    to: "/clinic/employee/departments",
    labelKey: "employeeDashboard.actions.departments",
    labelDefault: "РћС‚РґРµР»РµРЅРёСЏ",
  },
  {
    key: "rooms",
    icon: "рџљЄ",
    res: "room",
    act: "read",
    soon: false,
    to: "/clinic/employee/rooms",
    labelKey: "employeeDashboard.actions.rooms",
    labelDefault: "РљР°Р±РёРЅРµС‚С‹",
  },
  {
    key: "equipment",
    icon: "рџ”§",
    res: "equipment",
    act: "read",
    soon: false,
    to: "/clinic/employee/equipment",
    labelKey: "employeeDashboard.actions.equipment",
    labelDefault: "РћР±РѕСЂСѓРґРѕРІР°РЅРёРµ",
  },
  {
    key: "announcements",
    icon: "рџ“ў",
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/announcements",
    labelKey: "employeeDashboard.actions.announcements",
    labelDefault: "РћР±СЉСЏРІР»РµРЅРёСЏ",
  },
  {
    key: "knowledge",
    icon: "рџ“љ",
    res: "knowledge",
    act: "read",
    soon: false,
    to: "/clinic/employee/knowledge",
    labelKey: "employeeDashboard.actions.knowledge",
    labelDefault: "Р‘Р°Р·Р° Р·РЅР°РЅРёР№",
  },
  {
    key: "pharmacy",
    icon: "рџ’Љ",
    res: "pharmacy",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.pharmacySoon",
    labelDefault: "РђРїС‚РµРєР° (СЃРєРѕСЂРѕ)",
  },
  // в”Ђв”Ђ marketing / public site в”Ђв”Ђ
  {
    key: "vitrina",
    icon: "рџ–јпёЏ",
    res: "site_builder",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.vitrinaSoon",
    labelDefault: "Р’РёС‚СЂРёРЅР° (СЃРєРѕСЂРѕ)",
  },
  {
    key: "marketing",
    icon: "рџ“Ј",
    res: "marketing",
    act: "write",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.marketingSoon",
    labelDefault: "РџСѓР±Р»РёРєР°С†РёРё (СЃРєРѕСЂРѕ)",
  },
  {
    key: "reviews",
    icon: "в­ђ",
    res: "review",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.reviewsSoon",
    labelDefault: "РћС‚Р·С‹РІС‹ (СЃРєРѕСЂРѕ)",
  },
  {
    key: "analytics",
    icon: "рџ“Љ",
    res: "analytics",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.analyticsSoon",
    labelDefault: "РђРЅР°Р»РёС‚РёРєР° (СЃРєРѕСЂРѕ)",
  },
  {
    key: "leads",
    icon: "рџ“Ё",
    res: "lead",
    act: "read",
    soon: true,
    to: null,
    labelKey: "employeeDashboard.actions.leadsSoon",
    labelDefault: "РћР±СЂР°С‰РµРЅРёСЏ (СЃРєРѕСЂРѕ)",
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
    if (!d) return "вЂ”";
    try {
      return new Date(d).toLocaleDateString(i18n.language || undefined);
    } catch {
      return "вЂ”";
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
            clinicName: clinic?.name || "вЂ”",
          })}
        </p>
      </header>

      <section className="employee-dashboard-info">
        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">рџ‘¤</div>
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
          <div className="employee-dashboard-info-icon">рџЏҐ</div>
          <div className="employee-dashboard-info-content">
            <div className="employee-dashboard-info-label">
              {t("employeeDashboard.profile.clinic")}
            </div>
            <div className="employee-dashboard-info-value">
              {clinic?.name || "вЂ”"}
            </div>
            {clinic?.slug && (
              <div className="employee-dashboard-info-sub">/{clinic.slug}</div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-info-card">
          <div className="employee-dashboard-info-icon">рџЋ–пёЏ</div>
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
          <div className="employee-dashboard-info-icon">рџ“…</div>
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
                "Р”Р»СЏ РІР°С€РµР№ СЂРѕР»Рё РґРµР№СЃС‚РІРёСЏ РїРѕСЏРІСЏС‚СЃСЏ РІ СЃР»РµРґСѓСЋС‰РёС… РѕР±РЅРѕРІР»РµРЅРёСЏС….",
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
