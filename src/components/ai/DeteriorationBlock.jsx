import React from "react";
import { useTranslation } from "react-i18next";

export default function DeteriorationBlock({ summary }) {
  const { t } = useTranslation("PatientClinicalSummary");

  if (!summary?.dynamics?.length) return null;

  const worsening = summary.dynamics.some(
    (d) =>
      d.toLowerCase().includes("progress") ||
      d.toLowerCase().includes("worsen"),
  );

  if (!worsening) return null;

  return (
    <div className="alert alert-danger">
      <strong>⚠ {t("deterioration.title")}</strong>

      <div className="small">{t("deterioration.description")}</div>
    </div>
  );
}
