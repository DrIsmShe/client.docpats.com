import React from "react";
import { useTranslation } from "react-i18next";

const badgeClassMap = {
  low: "bg-success",
  moderate: "bg-warning text-dark",
  high: "bg-danger",
};

export default function PriorityRisksBlock({ risks }) {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!Array.isArray(risks) || risks.length === 0) return null;

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-3">
        🔥 {t("risk.priorityTitle", "Priority Clinical Risks")}
      </h5>

      {risks.map((risk, index) => (
        <div
          key={index}
          className="d-flex justify-content-between align-items-start border rounded p-2 mb-2"
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {t(`risk.domains.${risk.domain}`, risk.domain)}
            </div>
            <div className="small text-muted">{risk.reason}</div>
          </div>

          <span className={`badge ${badgeClassMap[risk.level]}`}>
            {t(`risk.levels.${risk.level}`, risk.level)}
          </span>
        </div>
      ))}
    </div>
  );
}
