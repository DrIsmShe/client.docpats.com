import React from "react";

const riskColor = (value) => {
  const n = Number(value || 0);
  if (n >= 80) return "#b91c1c";
  if (n >= 60) return "#ea580c";
  if (n >= 40) return "#ca8a04";
  if (n >= 20) return "#65a30d";
  return "#16a34a";
};

export default function RiskHeatmapBlock({ summary }) {
  const source =
    summary?.riskHeatmap || summary?.riskMap || summary?.domainRiskMap || null;

  let entries = [];

  if (Array.isArray(source)) {
    entries = source;
  } else if (source && typeof source === "object") {
    entries = Object.entries(source).map(([domain, score]) => ({
      domain,
      score,
    }));
  } else if (Array.isArray(summary?.priorityRisks)) {
    entries = summary.priorityRisks.map((r) => ({
      domain: r.domain || "unknown",
      score: r.level === "high" ? 85 : r.level === "moderate" ? 60 : 30,
    }));
  }

  if (!entries.length) return null;

  return (
    <div className="card shadow-sm border rounded-4 p-3 mb-3">
      <h5 className="mb-3">📊 Risk Heatmap</h5>

      <div className="row g-2">
        {entries.map((item, idx) => {
          const score = Number(item.score || 0);
          return (
            <div key={idx} className="col-md-4 col-sm-6">
              <div
                className="rounded-3 p-3 text-white"
                style={{
                  background: riskColor(score),
                  minHeight: 88,
                }}
              >
                <div style={{ fontWeight: 700, textTransform: "capitalize" }}>
                  {item.domain}
                </div>
                <div className="mt-2" style={{ fontSize: 22, fontWeight: 800 }}>
                  {score}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
