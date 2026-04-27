import React from "react";
import { useTranslation } from "react-i18next";

const ClinicalScoreBlock = ({ summary }) => {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!summary) return null;

  // 👇 ВСТАВИТЬ ЗДЕСЬ
  const riskIndex = Math.round(
    (summary?.riskScore ?? summary?.aiConfidence ?? 0) * 100,
  );

  const severity = summary?.clinicalSeverity ?? "low";

  const confidence = Math.round((summary?.aiConfidence ?? 0) * 100);

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-3">🧠 {t("ai.score", "AI Clinical Score")}</h5>

      <div className="row text-center">
        <div className="col-md-4">
          <div className="fw-bold">{t("clinicalScore.riskIndex")}</div>
          <div className="display-6 text-danger">{riskIndex}%</div>
        </div>

        <div className="col-md-4">
          <div className="fw-bold">{t("clinicalScore.severity")}</div>
          <div className="h4">{severity}</div>
        </div>

        <div className="col-md-4">
          <div className="fw-bold">{t("clinicalScore.confidence")}</div>
          <div className="h4">{confidence}%</div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalScoreBlock;
