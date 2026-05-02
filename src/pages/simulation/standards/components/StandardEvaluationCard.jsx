// src/pages/simulation/standards/components/StandardEvaluationCard.jsx
//
// Карточка одного измерения внутри ApplyStandardPanel.
// Показывает: label, current value, ideal/range, deviation, status pill.
//
// Visual принципы (consistent с MeasurementsPanel):
//   • dark background, blur
//   • status — точка слева
//   • value справа крупно
//   • range и deviation — мелко под label

import React from "react";
import { STATUS } from "../services/standardEvaluator.js";
import styles from "./ApplyStandardPanel.module.css";

const STATUS_COLOR = {
  [STATUS.IN_RANGE]: "#22c55e",
  [STATUS.ABOVE]: "#f59e0b",
  [STATUS.BELOW]: "#3d7fff",
  [STATUS.UNKNOWN]: "#64748b",
};

const STATUS_LABEL = {
  [STATUS.IN_RANGE]: "в норме",
  [STATUS.ABOVE]: "выше",
  [STATUS.BELOW]: "ниже",
  [STATUS.UNKNOWN]: "—",
};

function formatValue(value, unit) {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    // Crumley triangle: [3.0, 4.1, 5.2]
    return value.map((v) => v.toFixed(2)).join(" : ");
  }
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  if (unit === "°") return `${value.toFixed(1)}°`;
  if (unit === "mm") return `${value.toFixed(1)} mm`;
  if (unit === "ratio") return value.toFixed(2);
  if (unit === "") return value.toFixed(2);
  return `${value.toFixed(2)} ${unit}`;
}

function formatRange(target) {
  if (!target) return null;
  if (Array.isArray(target.ideal)) {
    return `${target.ideal.join(" : ")} ±${target.tolerance ?? 0}`;
  }
  if (target.min != null && target.max != null) {
    if (target.unit === "°") {
      return `${target.min}–${target.max}°`;
    }
    if (target.unit === "mm") {
      return `${target.min}–${target.max} mm`;
    }
    return `${target.min}–${target.max}`;
  }
  return null;
}

function formatDeviation(deviation, unit) {
  if (deviation == null) return null;
  if (Array.isArray(deviation)) {
    const max = Math.max(...deviation.map((d) => Math.abs(d)));
    if (max < 0.05) return null;
    return `Δ ${max > 0 ? "+" : ""}${max.toFixed(2)}`;
  }
  if (typeof deviation !== "number" || !Number.isFinite(deviation)) return null;
  if (Math.abs(deviation) < 0.01) return null;

  const sign = deviation > 0 ? "+" : "";
  if (unit === "°") return `Δ ${sign}${deviation.toFixed(1)}°`;
  if (unit === "mm") return `Δ ${sign}${deviation.toFixed(1)} mm`;
  return `Δ ${sign}${deviation.toFixed(2)}`;
}

export default function StandardEvaluationCard({ result }) {
  const color = STATUS_COLOR[result.status] || STATUS_COLOR[STATUS.UNKNOWN];
  const range = formatRange(result.target);
  const deviation = formatDeviation(result.deviation, result.unit);

  const valueText =
    result.formatted /* Crumley provides pre-formatted ratio */ ||
    formatValue(result.value, result.unit);

  return (
    <div className={styles.card}>
      <span
        className={styles.cardDot}
        style={{ background: color }}
        aria-hidden="true"
      />

      <div className={styles.cardMain}>
        <div className={styles.cardLabel}>{result.label}</div>
        {range && (
          <div className={styles.cardRange}>
            идеал: {range}
            {deviation && (
              <span className={styles.cardDeviation}> · {deviation}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.cardRight}>
        <div className={styles.cardValue}>{valueText}</div>
        <div className={styles.cardStatus} style={{ color }}>
          {STATUS_LABEL[result.status]}
        </div>
      </div>
    </div>
  );
}
