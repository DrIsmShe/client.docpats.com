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
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "../../axios";
import { getClinicMe, getEmployeeMe, employeeLogout } from "../../api/clinic";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ClinicNotificationBell from "../../components/notifications/ClinicNotificationBell";
import ClinicSubscriptionBanner from "./ClinicSubscriptionBanner";
import "./clinicLayout.css";

// Страницы зоны /clinic, доступные ВРАЧУ, у которого клиники ещё нет.
//
// Это исключение для онбординга: врач должен иметь возможность зайти и
// создать клинику. Список закрытый и короткий намеренно — раньше врача
// без клиники пускали НА ЛЮБУЮ страницу зоны в расчёте на то, что
// каждая страница сама себя защитит. Так и было написано в комментарии,
// и так работало ровно до первой страницы, которая проверку забудет.
//
// Защита, разложенная по двадцати страницам, — это не защита, а
// договорённость.
const ONBOARDING_PATHS = ["/clinic", "/clinic/create"];

export default function ClinicLayout({ employeeMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
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
              // Врач без клиники — законное состояние онбординга, но
              // только на двух страницах: хаб и создание. На остальные
              // ему смотреть не на что, и пускать его туда значит
              // показывать оболочку клиники, которой у него нет.
              const path = location.pathname.replace(/\/+$/, "") || "/clinic";
              if (data.role === "doctor" && ONBOARDING_PATHS.includes(path)) {
                setContext({ kind: "user", ...data });
                setLoading(false);
                return;
              }
              if (data.role === "doctor") {
                navigate("/clinic", { replace: true });
                return;
              }
              // Все остальные — не в этой зоне. Пациент, попавший сюда
              // по ссылке или из адресной строки, не должен увидеть даже
              // шапку кабинета клиники: чужой интерфейс без данных
              // выглядит как сбой и порождает вопросы, которых можно не
              // создавать.
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
  }, [employeeMode, navigate, location.pathname]);

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
        {/* Состояние подписки — над содержимым страницы, а не в углу:
            заморозка меняет то, что человек вообще может сделать, и
            узнавать об этом из неудачной попытки он не должен. */}
        <ClinicSubscriptionBanner
          subscription={context?.subscription}
          role={context?.role}
        />
        <Outlet context={context} />
      </main>
    </div>
  );
}
