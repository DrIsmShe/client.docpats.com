import React from "react";

export default function ExplainabilityBlock({ explainability }) {
  const factors = Array.isArray(explainability?.topFactors)
    ? explainability.topFactors
    : [];

  return (
    <div className="card p-3 mb-3">
      <h5>🧠 Why AI thinks this</h5>

      {factors.length === 0 ? (
        <div className="text-muted">AI has not identified key factors yet</div>
      ) : (
        factors.map((f, i) => (
          <div key={i}>{typeof f === "object" ? f.factor : String(f)}</div>
        ))
      )}
    </div>
  );
}
