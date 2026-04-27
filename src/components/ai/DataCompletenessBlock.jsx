import React from "react";

export default function DataCompletenessBlock({ meta }) {
  if (!meta) return null;

  const completeness =
    typeof meta.completeness === "number" ? meta.completeness : 0;

  const percent = Math.round(completeness * 100);

  return (
    <div className="card p-3 mb-3">
      <h5>📊 Data completeness</h5>

      <div>{percent}%</div>
    </div>
  );
}
