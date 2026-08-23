import React from "react";

import { useTranslation } from "react-i18next";
export default function DataCompletenessBlock({ meta }) {
  const { t } = useTranslation("common");
  if (!meta) return null;

  const completeness =
    typeof meta.completeness === "number" ? meta.completeness : 0;

  const percent = Math.round(completeness * 100);

  return (
    <div className="card p-3 mb-3">
      <h5>{t("dp.ai.dataCompleteness")}</h5>

      <div>{percent}%</div>
    </div>
  );
}
