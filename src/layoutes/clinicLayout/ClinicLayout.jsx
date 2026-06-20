// client/src/layouts/clinicLayout/ClinicLayout.jsx
//
// Layout wrapper for the /clinic/* zone.
// Provides:
// - top navigation (brand, language switcher, logout)
// - auth guard: redirects to /login if no session
// - onboarding guard: a logged-in DOCTOR without a clinic is allowed in
//   (so ClinicHubPage can offer "create clinic"); non-doctors without a
//   clinic are sent to the patient cabinet.
// - RTL support for Arabic
// - shared container styling
//
// Used for both DocPats users (owner/admin/manager) and ClinicEmployees,
// distinguished by the `employeeMode` prop.

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import { getClinicMe, getEmployeeMe, employeeLogout } from "../../api/clinic";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ClinicNotificationBell from "../../components/notifications/ClinicNotificationBell";
import "./clinicLayout.css";

export default function ClinicLayout({ employeeMode = false }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("clinic");

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);

  // ─── RTL support for Arabic ───
  useEffect(() => {
    const lang = (i18n.language || "en").split("-")[0];
    const isRtl = lang === "ar";
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  // ─── Load auth context ───
  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        if (employeeMode) {
          const data = await getEmployeeMe();
          if (!cancelled) {
            setContext({ kind: "employee", ...data });
            setLoading(false);
          }
        } else {
          // For DocPats users, /me is the canonical source
          const data = await getClinicMe();
          if (!cancelled) {
            if (!data.authenticated) {
              navigate("/login", { replace: true });
              return;
            }
            // Onboarding guard:
            //   - hasClinic === true  → full access (owner/admin/doctor/etc)
            //   - hasClinic === false + role "doctor" → allow in, so the
            //     ClinicHubPage can offer "Create clinic". A doctor without
            //     a clinic is a valid onboarding state, NOT a forbidden one.
            //   - hasClinic === false + any other role (patient, etc) →
            //     send to the patient cabinet.
            if (!data.hasClinic) {
              if (data.role === "doctor") {
                // Allowed — render layout; Hub/Create pages handle the rest.
                // Internal clinic pages (dashboard/staff/patients) themselves
                // require a clinic and will redirect to the hub if missing.
                setContext({ kind: "user", ...data });
                setLoading(false);
                return;
              }
              navigate("/patient/home-page", { replace: true });
              return;
            }
            setContext({ kind: "user", ...data });
            setLoading(false);
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate(employeeMode ? "/clinic/staff-login" : "/login", {
            replace: true,
          });
          return;
        }
        setError(err.message || t("common.error"));
        setLoading(false);
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [employeeMode, navigate]);

  async function handleLogout() {
    try {
      if (employeeMode) {
        await employeeLogout();
        navigate("/clinic/staff-login", { replace: true });
      } else {
        // DocPats user logout — use existing logout endpoint
        await axios.post("/logout").catch(() => {});
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="clinic-layout-loading">
        <div className="clinic-layout-spinner" />
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="clinic-layout-error">
        <h2>{t("common.error")}</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          {t("common.errorReload")}
        </button>
      </div>
    );
  }

  // ─── Header label (clinic name or employee name) ───
  const headerLabel = employeeMode
    ? context?.employee
      ? `${context.employee.firstName || ""} ${context.employee.lastName || ""}`.trim() ||
        context.employee.email
      : t("roles.member")
    : context?.clinic?.name || t("layout.brandName");

  return (
    <div className="clinic-layout">
      <header className="clinic-layout-header">
        <div className="clinic-layout-header-left">
          <Link
            to={employeeMode ? "/clinic/employee" : "/clinic"}
            className="clinic-layout-brand"
          >
            <span className="clinic-layout-brand-mark">DP</span>
            <span className="clinic-layout-brand-name">
              {t("layout.brandName")}
            </span>
          </Link>
          <span className="clinic-layout-context">{headerLabel}</span>
        </div>
        <div className="clinic-layout-header-right">
          <ClinicNotificationBell limit={8} />
          <LanguageSwitcher />
          <button
            className="clinic-layout-logout"
            onClick={handleLogout}
            type="button"
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      <main className="clinic-layout-main">
        <Outlet context={context} />
      </main>
    </div>
  );
}
