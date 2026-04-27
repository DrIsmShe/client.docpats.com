// src/pages/simulation/components/viewer/BeforeAfterViewer.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import BeforeAfterSlider from "./BeforeAfterSlider.jsx";
import ExportPanel from "./ExportPanel.jsx";
import { useFullResExport } from "../../hooks/useFullResExport.js";

import styles from "./BeforeAfterViewer.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Контейнер viewer'а: автоматически готовит full-res при mount'е,
   показывает loader → slider + ExportPanel.
   ────────────────────────────────────────────────────────────────────────── */

export default function BeforeAfterViewer({ plan }) {
  const { t } = useTranslation("Simulation");

  const { status, original, warped, error, prepare, download } =
    useFullResExport({
      photoUrl: plan?.photo?.url,
      points: plan?.controlPoints,
    });

  /* ────────── Автоматически готовить при открытии taba ────────── */
  useEffect(() => {
    if (status === "idle") prepare();
  }, [status, prepare]);

  if (status === "error") {
    return (
      <div className={styles.viewerEmpty}>
        <div className={styles.viewerEmptyTitle}>{t("viewer.exportError")}</div>
        <div className={styles.viewerEmptyHint}>{error?.message}</div>
        <button className={styles.viewerRetryButton} onClick={() => prepare()}>
          {t("viewer.retry")}
        </button>
      </div>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className={styles.viewerEmpty}>
        <div className={styles.viewerEmptyTitle}>{t("viewer.preparing")}</div>
        <div className={styles.viewerEmptyHint}>
          {t("viewer.preparingHint")}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewerRoot}>
      <div className={styles.viewerSliderWrap}>
        <BeforeAfterSlider
          original={original}
          warped={warped}
          labelBefore={t("viewer.labelBefore")}
          labelAfter={t("viewer.labelAfter")}
        />
      </div>
      <ExportPanel onDownload={download} disabled={status !== "ready"} />
    </div>
  );
}
