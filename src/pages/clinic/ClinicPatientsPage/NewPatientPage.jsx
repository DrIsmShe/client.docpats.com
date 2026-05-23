// client/src/pages/clinic/ClinicPatientsPage/NewPatientPage.jsx
//
// Standalone page hosting the PatientRegistrationWizard.
// Route: /clinic/patients/new
//
// Layout matches other clinic pages (header + back link + content shell)
// so the wizard sits naturally inside ClinicLayout's outlet.
//
// On success the wizard calls onComplete(result) — we forward the user
// to the patient detail page. If the result includes provisionalCredentials
// the wizard itself renders the "card view" step BEFORE calling onComplete,
// so by the time we navigate, the receptionist has already had a chance
// to print/copy.

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PatientRegistrationWizard from "./PatientRegistrationWizard";
import "./newPatientPage.css";

export default function NewPatientPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();

  function handleComplete(result) {
    // Wizard returns either the patient object (no provisional) or
    // { patient, provisionalCredentials } (provisional flow).
    const patient = result?.patient || result;
    if (patient?._id) {
      navigate(`/clinic/patients/${patient._id}`, { replace: true });
    } else {
      navigate("/clinic/patients", { replace: true });
    }
  }

  function handleCancel() {
    navigate("/clinic/patients");
  }

  return (
    <div className="new-patient-page">
      <div className="new-patient-page-header">
        <Link to="/clinic/patients" className="staff-page-back">
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
