// client/src/pages/clinic/ClinicPatientsPage/NewPatientPage.jsx
//
// Standalone page hosting the PatientRegistrationWizard.
// Routes:
//   /clinic/patients/new            → owner/admin zone
//   /clinic/employee/patients/new   → employee (receptionist) zone
//
// ZONE-AWARE: detects owner vs employee from the layout context
// (`kind === "employee"`) with a pathname fallback, and builds all
// navigation from `basePath`. In employee mode there is NO patient
// detail page yet (it exposes the medical record, which receptionists
// can't access), so after a successful create we return to the LIST
// instead of the detail page.

import React from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import PatientRegistrationWizard from "./PatientRegistrationWizard";
import "./newPatientPage.css";

export default function NewPatientPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const layoutContext = useOutletContext();
  const location = useLocation();

  const isEmployee =
    layoutContext?.kind === "employee" ||
    location.pathname.startsWith("/clinic/employee");
  const basePath = isEmployee ? "/clinic/employee" : "/clinic";

  function handleComplete(result) {
    // Wizard returns either the patient object (no provisional) or
    // { patient, provisionalCredentials } (provisional flow).
    const patient = result?.patient || result;

    // Employee zone: no detail page — always return to the list.
    if (isEmployee) {
      navigate(`${basePath}/patients`, { replace: true });
      return;
    }

    if (patient?._id) {
      navigate(`${basePath}/patients/${patient._id}`, { replace: true });
    } else {
      navigate(`${basePath}/patients`, { replace: true });
    }
  }

  function handleCancel() {
    navigate(`${basePath}/patients`);
  }

  return (
    <div className="new-patient-page">
      <div className="new-patient-page-header">
        <Link to={`${basePath}/patients`} className="staff-page-back">
          {t("patients.backToList", { defaultValue: "← К списку пациентов" })}
        </Link>
        <h1>
          {t("patients.wizardTitle", {
            defaultValue: "Регистрация пациента",
          })}
        </h1>
        <p className="staff-page-subtitle">
          {t("patients.wizardSubtitle", {
            defaultValue:
              "Сначала проверим, не зарегистрирован ли пациент в DocPats уже. Это защитит от дублей и даст пациенту полноценный аккаунт.",
          })}
        </p>
      </div>

      <PatientRegistrationWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
