import React from "react";

export default function AIConfidenceScoreBlock({ summary, meta }) {
  const confidence =
    meta?.confidenceScore ??
    summary?.confidenceScore ??
    summary?.aiConfidence ??
    null;

  if (confidence === null || confidence === undefined) return null;

  const normalized = Math.max(0, Math.min(100, Number(confidence)));
  const tone =
    normalized >= 80 ? "#198754" : normalized >= 60 ? "#fd7e14" : "#dc3545";

  return (
    <div className="card shadow-sm border rounded-4 p-3 mb-3">
      <h5 className="mb-3">🧠 AI Confidence Score</h5>

      <div
        style={{
          width: "100%",
          height: 14,
          background: "#edf2f7",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${normalized}%`,
            height: "100%",
            background: tone,
            transition: "width .35s ease",
          }}
        />
      </div>

      <div className="mt-2 d-flex justify-content-between align-items-center">
        <span className="text-muted small">Model confidence</span>
        <strong style={{ color: tone }}>{normalized}%</strong>
      </div>
    </div>
  );
}
