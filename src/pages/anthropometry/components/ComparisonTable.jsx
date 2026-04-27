import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";
import {
  computeDistance,
  computeAngle,
  formatMeasurement,
} from "../utils/annotationHelpers.js";

/* ─── ComparisonTable ──────────────────────────────────────
   Строит сравнительную таблицу measurements от двух annotation.
   Matching по label. Unmatched показываются отдельно.

   Props:
   - leftAnnotation, rightAnnotation — сами документы (или null)
   - leftImageSize, rightImageSize — {w, h} для пересчёта в мм
   - leftPixelsPerMm, rightPixelsPerMm — из study.calibration
   ──────────────────────────────────────────────────────────── */

function ComparisonTable({
  leftAnnotation,
  rightAnnotation,
  leftImageSize,
  rightImageSize,
  leftPixelsPerMm,
  rightPixelsPerMm,
}) {
  const { t } = useTranslation("Anthropometry");

  /* ─── Compute measurements для каждой стороны ─── */
  const computeForSide = (annotation, imageSize, pixelsPerMm) => {
    if (!annotation || !imageSize) return [];
    const lmByKey = {};
    for (const lm of annotation.landmarks || []) lmByKey[lm.key] = lm;

    return (annotation.measurements || [])
      .map((m) => {
        const pts = m.landmarks.map((k) => lmByKey[k]).filter(Boolean);
        if (pts.length !== m.landmarks.length) return null;

        if (m.type === "distance" && pts.length === 2) {
          const { value, unit } = computeDistance(
            pts[0],
            pts[1],
            imageSize.w,
            imageSize.h,
            pixelsPerMm,
          );
          return { label: m.label, type: m.type, value, unit };
        }
        if (m.type === "angle" && pts.length === 3) {
          const { value, unit } = computeAngle(
            pts[0],
            pts[1],
            pts[2],
            imageSize.w,
            imageSize.h,
          );
          return { label: m.label, type: m.type, value, unit };
        }
        return null;
      })
      .filter(Boolean);
  };

  const leftMeasures = useMemo(
    () => computeForSide(leftAnnotation, leftImageSize, leftPixelsPerMm),
    [leftAnnotation, leftImageSize, leftPixelsPerMm],
  );
  const rightMeasures = useMemo(
    () => computeForSide(rightAnnotation, rightImageSize, rightPixelsPerMm),
    [rightAnnotation, rightImageSize, rightPixelsPerMm],
  );

  /* ─── Matching по label ─── */
  const matched = useMemo(() => {
    const leftByLabel = {};
    leftMeasures.forEach((m) => {
      leftByLabel[m.label] = m;
    });
    const rightByLabel = {};
    rightMeasures.forEach((m) => {
      rightByLabel[m.label] = m;
    });

    const allLabels = Array.from(
      new Set([...Object.keys(leftByLabel), ...Object.keys(rightByLabel)]),
    ).sort();

    return allLabels.map((label) => {
      const left = leftByLabel[label];
      const right = rightByLabel[label];

      const hasBoth = left && right;
      const hasSameType = hasBoth && left.type === right.type;
      const hasSameUnit = hasBoth && left.unit === right.unit;

      let delta = null;
      let percentChange = null;

      if (hasBoth && hasSameType && hasSameUnit) {
        delta = right.value - left.value;
        if (left.type === "distance" && Math.abs(left.value) > 0.001) {
          percentChange = (delta / left.value) * 100;
        }
      }

      return {
        label,
        type: left?.type || right?.type,
        left,
        right,
        hasBoth,
        hasSameType,
        hasSameUnit,
        delta,
        percentChange,
      };
    });
  }, [leftMeasures, rightMeasures]);

  const onlyLeft = matched.filter((m) => m.left && !m.right);
  const onlyRight = matched.filter((m) => !m.left && m.right);
  const bothSides = matched.filter((m) => m.left && m.right);

  /* ─── Empty states ─── */
  if (leftMeasures.length === 0 && rightMeasures.length === 0) {
    return (
      <div className={styles.comparisonTableEmpty}>
        <span>{t("compare.tableEmpty")}</span>
      </div>
    );
  }

  const formatDelta = (delta, unit) => {
    if (delta === null) return "—";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${formatMeasurement(delta, unit)}`;
  };

  const formatPercent = (percent) => {
    if (percent === null) return "—";
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const deltaClass = (delta) => {
    if (delta === null || Math.abs(delta) < 0.05) return styles.deltaNeutral;
    if (delta > 0) return styles.deltaPositive;
    return styles.deltaNegative;
  };

  return (
    <div className={styles.comparisonTableWrap}>
      <div className={styles.comparisonTableHeader}>
        <span className={styles.comparisonTableTitle}>
          {t("compare.tableTitle")}
        </span>
        <span className={styles.comparisonTableCount}>
          {bothSides.length} /{" "}
          {bothSides.length + onlyLeft.length + onlyRight.length}{" "}
          {t("compare.tableMatched")}
        </span>
      </div>

      {bothSides.length > 0 && (
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th className={styles.compTblColLabel}>
                {t("compare.colLabel")}
              </th>
              <th className={styles.compTblColType}>{t("compare.colType")}</th>
              <th className={styles.compTblColValue}>{t("compare.before")}</th>
              <th className={styles.compTblColValue}>{t("compare.after")}</th>
              <th className={styles.compTblColDelta}>Δ</th>
              <th className={styles.compTblColPercent}>%</th>
            </tr>
          </thead>
          <tbody>
            {bothSides.map((row) => (
              <tr key={row.label}>
                <td className={styles.compTblLabelCell}>
                  <span className={styles.comparisonRowIcon}>
                    {row.type === "distance" ? "⟼" : "∠"}
                  </span>
                  {row.label}
                </td>
                <td className={styles.compTblTypeCell}>
                  {t(`compare.type_${row.type}`)}
                </td>
                <td className={styles.compTblValueCell}>
                  {formatMeasurement(row.left.value, row.left.unit)}
                </td>
                <td className={styles.compTblValueCell}>
                  {formatMeasurement(row.right.value, row.right.unit)}
                </td>
                <td
                  className={`${styles.compTblDeltaCell} ${deltaClass(row.delta)}`}
                >
                  {row.hasSameType && row.hasSameUnit
                    ? formatDelta(row.delta, row.left.unit)
                    : "—"}
                </td>
                <td
                  className={`${styles.compTblPercentCell} ${deltaClass(row.percentChange)}`}
                >
                  {row.type === "distance" && row.hasSameUnit
                    ? formatPercent(row.percentChange)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {bothSides.length === 0 &&
        (leftMeasures.length > 0 || rightMeasures.length > 0) && (
          <div className={styles.comparisonNoMatchWarn}>
            ⚠ {t("compare.noMatchWarning")}
          </div>
        )}

      {(onlyLeft.length > 0 || onlyRight.length > 0) && (
        <div className={styles.comparisonUnmatched}>
          {onlyLeft.length > 0 && (
            <div className={styles.comparisonUnmatchedRow}>
              <span className={styles.comparisonUnmatchedLabel}>
                {t("compare.onlyBefore")}:
              </span>
              {onlyLeft.map((m) => (
                <span key={m.label} className={styles.measureChip}>
                  <span className={styles.measureChipIcon}>
                    {m.type === "distance" ? "⟼" : "∠"}
                  </span>
                  {m.label}: {formatMeasurement(m.left.value, m.left.unit)}
                </span>
              ))}
            </div>
          )}
          {onlyRight.length > 0 && (
            <div className={styles.comparisonUnmatchedRow}>
              <span className={styles.comparisonUnmatchedLabel}>
                {t("compare.onlyAfter")}:
              </span>
              {onlyRight.map((m) => (
                <span key={m.label} className={styles.measureChip}>
                  <span className={styles.measureChipIcon}>
                    {m.type === "distance" ? "⟼" : "∠"}
                  </span>
                  {m.label}: {formatMeasurement(m.right.value, m.right.unit)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComparisonTable;
