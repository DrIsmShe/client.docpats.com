// src/pages/simulation/components/editor/PointPropertiesPanel.jsx
//
// S.7.7+ — рендерится внутри правой колонки под MeasurementsPanel.
// Стили перенесены в SimulationEditor.module.css → .propsPanel*

import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./SimulationEditor.module.css";

export default function PointPropertiesPanel({
  point,
  onChange,
  onDelete,
  inline = false,
}) {
  const { t } = useTranslation("Simulation");

  if (!point) return null;

  const handleRadius = (e) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) onChange?.({ radius: v });
  };

  const handleStrength = (e) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) onChange?.({ strength: v });
  };

  return (
    <div
      className={`${styles.propsPanel} ${inline ? styles.propsPanelInline : ""}`}
    >
      <div className={styles.propsPanelHeader}>
        <span>
          {t("points.propsTitle", { defaultValue: "Точка деформации" })}
        </span>
        <button
          type="button"
          className={styles.propsPanelDelete}
          onClick={onDelete}
          title={t("points.delete", { defaultValue: "Удалить" })}
          aria-label={t("points.delete", { defaultValue: "Удалить" })}
        >
          ×
        </button>
      </div>

      <label className={styles.propsPanelField}>
        <div className={styles.propsPanelLabel}>
          <span>{t("points.radius", { defaultValue: "Радиус влияния" })}</span>
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
          <span>{t("points.strength", { defaultValue: "Сила" })}</span>
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

      <button
        type="button"
        className={styles.propsPanelDeleteBtn}
        onClick={onDelete}
      >
        {t("points.delete", { defaultValue: "Удалить точку" })}
      </button>
    </div>
  );
}
