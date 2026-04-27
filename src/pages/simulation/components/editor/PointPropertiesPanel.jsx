// src/pages/simulation/components/editor/PointPropertiesPanel.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./SimulationEditor.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Panel справа снизу с настройками выделенной точки.
   Скрыт если нет selected.
   ────────────────────────────────────────────────────────────────────────── */

export default function PointPropertiesPanel({ point, onChange, onDelete }) {
  const { t } = useTranslation("Simulation");

  if (!point) return null;

  const handleRadius = (e) => {
    const v = parseFloat(e.target.value);
    onChange?.({ radius: v });
  };

  const handleStrength = (e) => {
    const v = parseFloat(e.target.value);
    onChange?.({ strength: v });
  };

  return (
    <div className={styles.propsPanel}>
      <div className={styles.propsPanelHeader}>
        <span>{t("points.propsTitle")}</span>
        <button
          type="button"
          className={styles.propsPanelDelete}
          onClick={onDelete}
          title={t("points.delete")}
          aria-label={t("points.delete")}
        >
          ×
        </button>
      </div>

      <label className={styles.propsPanelField}>
        <div className={styles.propsPanelLabel}>
          <span>{t("points.radius")}</span>
          <span className={styles.propsPanelValue}>
            {(point.radius * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min="0.01"
          max="0.5"
          step="0.005"
          value={point.radius}
          onChange={handleRadius}
          className={styles.propsPanelSlider}
        />
      </label>

      <label className={styles.propsPanelField}>
        <div className={styles.propsPanelLabel}>
          <span>{t("points.strength")}</span>
          <span className={styles.propsPanelValue}>
            {point.strength.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={point.strength}
          onChange={handleStrength}
          className={styles.propsPanelSlider}
        />
      </label>

      <div className={styles.propsPanelHint}>{t("points.hint")}</div>
    </div>
  );
}
