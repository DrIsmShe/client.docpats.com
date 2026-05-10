// client/src/layouts/clinicLayout/ClinicLayout.jsx
//
// Layout wrapper for the /clinic/* zone.
// Provides:
// - top navigation (logo, language switcher, logout)
// - auth guard: redirects to /login if no session
// - shared container styling
//
// Used for both DocPats users (owner/admin/manager) and ClinicEmployees,
// distinguished by the `employeeMode` prop.

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import axios from "../../axios";
import { getClinicMe, getEmployeeMe, employeeLogout } from "../../api/clinic";
import "./clinicLayout.css";

export default function ClinicLayout({ employeeMode = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);

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
        setError(err.message || "Failed to load");
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

  if (loading) {
    return (
      <div className="clinic-layout-loading">
        <div className="clinic-layout-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="clinic-layout-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  const headerLabel = employeeMode
    ? context?.employee
      ? `${context.employee.firstName || ""} ${context.employee.lastName || ""}`.trim() ||
        context.employee.email
      : "Employee"
    : context?.clinic?.name || "DocPats Clinic";

  return (
    <div className="clinic-layout">
      <header className="clinic-layout-header">
        <div className="clinic-layout-header-left">
          <Link
            to={employeeMode ? "/clinic/employee" : "/clinic"}
            className="clinic-layout-brand"
          >
            <span className="clinic-layout-brand-mark">DP</span>
            <span className="clinic-layout-brand-name">DocPats Clinic</span>
          </Link>
          <span className="clinic-layout-context">{headerLabel}</span>
        </div>
        <div className="clinic-layout-header-right">
          <button className="clinic-layout-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="clinic-layout-main">
        <Outlet context={context} />
      </main>
    </div>
  );
}
