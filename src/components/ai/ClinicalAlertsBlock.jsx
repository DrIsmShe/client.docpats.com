import React from "react";
import { useTranslation } from "react-i18next";

const levelClassMap = {
  low: "alert alert-info",
  moderate: "alert alert-warning",
  high: "alert alert-danger",
};

const levelIconMap = {
  low: "ℹ️",
  moderate: "⚠️",
  high: "🚨",
};

export default function ClinicalAlertsBlock({ alerts = [] }) {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!Array.isArray(alerts) || alerts.length === 0) return null;

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-3">🚨 {t("clinicalAlerts.title")}</h5>

      <div className="d-flex flex-column gap-2">
        {alerts.map((alert, index) => {
          const level = ["low", "moderate", "high"].includes(alert?.level)
            ? alert.level
            : "low";

          return (
            <div key={index} className={levelClassMap[level]}>
              <div className="fw-semibold mb-1">
                {levelIconMap[level]}{" "}
                {alert?.title || t("clinicalAlerts.defaultTitle")}
              </div>

              {alert?.message && <div className="mb-1">{alert.message}</div>}

              {alert?.source && (
                <div className="small text-muted">
                  {t("clinicalAlerts.source")}: {alert.source}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
