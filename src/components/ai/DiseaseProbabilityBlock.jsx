import React from "react";
import { useTranslation } from "react-i18next";

export default function DiseaseProbabilityBlock({ probabilities }) {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!probabilities || probabilities.length === 0) return null;

  return (
    <div className="card shadow-sm border rounded-3 p-3 mb-3">
      <h5 className="mb-3">🧬 {t("diseaseProbability.title")}</h5>

      {probabilities.map((disease, index) => (
        <div key={index} className="mb-2">
          <div className="d-flex justify-content-between">
            <span>{disease.name}</span>
            <span>{Math.round(disease.probability * 100)}%</span>
          </div>

          <div className="progress">
            <div
              className="progress-bar bg-danger"
              style={{
                width: `${disease.probability * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
