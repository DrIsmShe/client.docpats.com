import React from "react";

import { useTranslation } from "react-i18next";
export default function DiagnosisProbabilityBars({ probabilities }) {
  const { t } = useTranslation("common");
  if (!Array.isArray(probabilities) || !probabilities.length) return null;

  const normalized = probabilities
    .map((item) => ({
      name: item.name || item.diagnosis || item.label || "Unknown",
      probability: Number(item.probability ?? item.percent ?? item.score ?? 0),
    }))
    .sort((a, b) => b.probability - a.probability);

  return (
    <div className="card shadow-sm border rounded-4 p-3 mb-3">
      <h5 className="mb-3">{t("dp.ai.probabilityBars")}</h5>

      <div className="d-flex flex-column gap-3">
        {normalized.map((item, idx) => (
          <div key={idx}>
            <div className="d-flex justify-content-between mb-1">
              <span>{item.name}</span>
              <strong>{item.probability}%</strong>
            </div>

            <div
              style={{
                width: "100%",
                height: 12,
                background: "#e9ecef",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, item.probability))}%`,
                  height: "100%",
                  background: "#0d6efd",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
