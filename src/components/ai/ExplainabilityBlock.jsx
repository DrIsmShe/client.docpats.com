import React from "react";

import { useTranslation } from "react-i18next";
export default function ExplainabilityBlock({ explainability }) {
  const { t } = useTranslation("common");
  const factors = Array.isArray(explainability?.topFactors)
    ? explainability.topFactors
    : [];

  return (
    <div className="card p-3 mb-3">
      <h5>{t("dp.ai.why")}</h5>

      {factors.length === 0 ? (
        <div className="text-muted">{t("dp.ai.noFactors")}</div>
      ) : (
        factors.map((f, i) => (
          <div key={i}>{typeof f === "object" ? f.factor : String(f)}</div>
        ))
      )}
    </div>
  );
}
