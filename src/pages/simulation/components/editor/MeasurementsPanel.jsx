// src/pages/simulation/components/editor/MeasurementsPanel.jsx
//
// Боковая панель с тремя измерениями:
//   • Nasofrontal angle  (град.)   норма 115°–135°
//   • Goode's projection (ratio)   норма 0.55–0.60
//   • Alar base width    (mm/px)   зависит от калибровки
//
// Каждое измерение можно скрыть/показать индивидуально (state.visibleMeasurements).
// Out-of-range значения подсвечиваются красным.

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  toggleMeasurement,
  selectVisibleMeasurements,
} from "../../store/simulationSlice.js";
import { useMeasurements } from "../../hooks/useMeasurements.js";
import { formatMeasurement } from "../../mediapipe/measurements.js";
import styles from "./MeasurementsPanel.module.css";

const ROWS = [
  {
    key: "nasofrontalAngle",
    type: "angle",
    color: "#3d7fff",
    normalLabel: "115°–135°",
  },
  {
    key: "goodeProjection",
    type: "ratio",
    color: "#22c55e",
    normalLabel: "0.55–0.60",
  },
  {
    key: "alarBaseWidth",
    type: "distance",
    color: "#f59e0b",
    normalLabel: null, // зависит от пациента, нет универсальной нормы
  },
];

export default function MeasurementsPanel() {
  const { t } = useTranslation("Simulation");
  const dispatch = useDispatch();
  const visible = useSelector(selectVisibleMeasurements);
  const { measurements, calibration, imageWidth, hasLandmarks } =
    useMeasurements();

  if (!hasLandmarks) {
    return (
      <div className={styles.panel}>
        <h4 className={styles.title}>{t("measurements.title")}</h4>
        <div className={styles.empty}>{t("measurements.noLandmarks")}</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h4 className={styles.title}>{t("measurements.title")}</h4>

      <div className={styles.rows}>
        {ROWS.map((row) => {
          const m = measurements[row.key];
          const isVisible = visible[row.key];
          const isComputable = m != null;
          const formatted = isComputable
            ? formatMeasurement(row.type, m.value, calibration, imageWidth)
            : { primary: "—" };

          const outOfRange =
            isComputable &&
            m.inNormalRange === false &&
            row.key !== "alarBaseWidth";

          return (
            <div
              key={row.key}
              className={`${styles.row} ${isVisible ? "" : styles.rowHidden}`}
            >
              <button
                type="button"
                className={styles.rowToggle}
                onClick={() => dispatch(toggleMeasurement(row.key))}
                aria-label={t(
                  isVisible ? "measurements.hide" : "measurements.show",
                )}
                aria-pressed={isVisible}
              >
                <span
                  className={styles.rowDot}
                  style={{
                    background: isVisible ? row.color : "transparent",
                    borderColor: row.color,
                  }}
                />
              </button>

              <div className={styles.rowMain}>
                <div className={styles.rowLabel}>
                  {t(`measurements.${row.key}.label`)}
                </div>
                {row.normalLabel && (
                  <div className={styles.rowNormal}>
                    {t("measurements.normal")}: {row.normalLabel}
                  </div>
                )}
                {formatted.secondary && (
                  <div className={styles.rowNormal}>{formatted.secondary}</div>
                )}
              </div>

              <div
                className={`${styles.rowValue} ${
                  outOfRange ? styles.rowValueOut : ""
                }`}
              >
                {formatted.primary}
              </div>
            </div>
          );
        })}
      </div>

      {!calibration && (
        <div className={styles.calibrationHint}>
          {t("measurements.calibrationHint")}
        </div>
      )}
    </div>
  );
}
