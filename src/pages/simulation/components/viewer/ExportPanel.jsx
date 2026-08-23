// src/pages/simulation/components/viewer/ExportPanel.jsx
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styles from "./BeforeAfterViewer.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   UI для скачивания. Не делает warp сам — получает .download() из hook'а.
   ────────────────────────────────────────────────────────────────────────── */

export default function ExportPanel({ onDownload, disabled }) {
  const { t } = useTranslation("Simulation");
  const [mode, setMode] = useState("after");
  const [format, setFormat] = useState("image/jpeg");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      await onDownload({
        mode,
        format,
        quality: quality / 100,
        labels: {
          before: t("viewer.labelBefore"),
          after: t("viewer.labelAfter"),
        },
      });
    } catch (err) {
      console.error("[simulation/export] download failed:", err);
    } finally {
      setBusy(false);
    }
  }, [onDownload, mode, format, quality, t]);

  return (
    <div className={styles.exportPanel}>
      <div className={styles.exportPanelTitle}>{t("export.title")}</div>

      {/* Mode */}
      <div className={styles.exportPanelField}>
        <div className={styles.exportPanelLabel}>{t("export.mode")}</div>
        <div className={styles.exportPanelRadioRow}>
          {["before", "after", "sideBySide"].map((m) => (
            <label key={m} className={styles.exportPanelRadio}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              <span>{t(`export.modes.${m}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className={styles.exportPanelField}>
        <div className={styles.exportPanelLabel}>{t("export.format")}</div>
        <div className={styles.exportPanelRadioRow}>
          <label className={styles.exportPanelRadio}>
            <input
              type="radio"
              name="format"
              value="image/jpeg"
              checked={format === "image/jpeg"}
              onChange={() => setFormat("image/jpeg")}
            />
            <span>{t("common:dp.scan.jpg")}</span>
          </label>
          <label className={styles.exportPanelRadio}>
            <input
              type="radio"
              name="format"
              value="image/png"
              checked={format === "image/png"}
              onChange={() => setFormat("image/png")}
            />
            <span>{t("common:dp.scan.png")}</span>
          </label>
        </div>
      </div>

      {/* Quality (только для JPG) */}
      {format === "image/jpeg" && (
        <div className={styles.exportPanelField}>
          <div className={styles.exportPanelLabel}>
            <span>{t("export.quality")}</span>
            <span className={styles.exportPanelValue}>{quality}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="100"
            step="1"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
            className={styles.exportPanelSlider}
          />
        </div>
      )}

      <button
        type="button"
        className={styles.exportDownloadButton}
        onClick={handleDownload}
        disabled={disabled || busy}
      >
        {busy ? t("export.downloading") : t("export.download")}
      </button>
    </div>
  );
}
