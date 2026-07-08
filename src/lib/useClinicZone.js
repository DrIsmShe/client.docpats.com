// client/src/lib/useClinicZone.js
//
// Zone detection for pages rendered under ClinicLayout.
// owner zone     →  /clinic/*
// employee zone  →  /clinic/employee/*
// A shared page must never hardcode "/clinic/..." for its own navigation.

import { useOutletContext, useLocation } from "react-router-dom";

export function useClinicZone() {
  const ctx = useOutletContext();
  const location = useLocation();

  const isEmployeeZone =
    ctx?.kind === "employee" ||
    location.pathname === "/clinic/employee" ||
    location.pathname.startsWith("/clinic/employee/");

  const basePath = isEmployeeZone ? "/clinic/employee" : "/clinic";
  const dashboardPath = isEmployeeZone ? "/clinic/employee" : "/clinic/dashboard";
  const loginPath = isEmployeeZone ? "/clinic/staff-login" : "/login";

  return { isEmployeeZone, basePath, dashboardPath, loginPath };
}

export default useClinicZone;
