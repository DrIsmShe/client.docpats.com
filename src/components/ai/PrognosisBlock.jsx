import React from "react";

import { useTranslation } from "react-i18next";
const TARGET_LABELS = {
  hospitalization_30d: "30-day hospitalization risk",
  deterioration_72h: "72-hour clinical deterioration",
};

export default function PrognosisBlock({ prognosis }) {
  const { t } = useTranslation("common");
  if (!Array.isArray(prognosis) || prognosis.length === 0) return null;

  return (
    <div className="card p-3 mb-3">
      <h5>{t("dp.ai.prognosis")}</h5>

      {prognosis.map((p, i) => {
        const probability =
          typeof p?.probability === "number" ? p.probability : 0;

        const percent = (probability * 100).toFixed(0);

        return (
          <div key={i} className="d-flex justify-content-between">
            <span>{TARGET_LABELS[p.target] || p.target}</span>
            <span>{percent}%</span>
          </div>
        );
      })}
    </div>
  );
}
