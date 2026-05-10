// client/src/pages/clinic/ClinicHubPage/ClinicHubPage.jsx

import React from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./clinicHubPage.css";

export default function ClinicHubPage() {
  const { t } = useTranslation("clinic");
  const context = useOutletContext();
  const navigate = useNavigate();

  // If user already has a clinic, redirect to dashboard
  React.useEffect(() => {
    if (context?.kind === "user" && context.hasClinic) {
      navigate("/clinic/dashboard", { replace: true });
    }
  }, [context, navigate]);

  if (context?.kind === "user" && context.hasClinic) {
    return null;
  }

  return (
    <div className="clinic-hub">
      <div className="clinic-hub-card">
        <div className="clinic-hub-icon">🏥</div>
        <h1 className="clinic-hub-title">{t("hub.title")}</h1>
        <p className="clinic-hub-subtitle">{t("hub.subtitle")}</p>

        <div className="clinic-hub-actions">
          <Link to="/clinic/create" className="clinic-hub-btn-primary">
            {t("hub.createClinic")}
          </Link>
        </div>

        <div className="clinic-hub-divider">
          <span>{t("hub.or")}</span>
        </div>

        <div className="clinic-hub-secondary">
          <p>{t("hub.alreadyInvited")}</p>
          <Link to="/clinic/staff-login" className="clinic-hub-btn-secondary">
            {t("hub.signInAsEmployee")}
          </Link>
        </div>
      </div>

      <div className="clinic-hub-features">
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">👥</span>
          <h3>{t("hub.features.team.title")}</h3>
          <p>{t("hub.features.team.description")}</p>
        </div>
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">📅</span>
          <h3>{t("hub.features.scheduling.title")}</h3>
          <p>{t("hub.features.scheduling.description")}</p>
        </div>
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">🔒</span>
          <h3>{t("hub.features.hipaa.title")}</h3>
          <p>{t("hub.features.hipaa.description")}</p>
        </div>
      </div>
    </div>
  );
}
