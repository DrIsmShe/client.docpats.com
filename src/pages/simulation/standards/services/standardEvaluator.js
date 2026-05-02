// src/pages/simulation/standards/services/standardEvaluator.js
//
// Оценка измерений относительно выбранного стандарта.
// Универсальная: работает для любой категории (rhinoplasty, mammoplasty),
// потому что принимает уже посчитанные measurements в виде map { key → measurement }.

import { getStandardById } from "../data/index.js";

export const STATUS = Object.freeze({
  IN_RANGE: "in_range",
  ABOVE: "above",
  BELOW: "below",
  UNKNOWN: "unknown",
});

export function evaluateScalar(value, target) {
  if (value == null || !Number.isFinite(value) || !target)
    return STATUS.UNKNOWN;
  if (target.min != null && value < target.min) return STATUS.BELOW;
  if (target.max != null && value > target.max) return STATUS.ABOVE;
  return STATUS.IN_RANGE;
}

export function evaluateCrumley(sortedSides, target) {
  if (
    !Array.isArray(sortedSides) ||
    sortedSides.length !== 3 ||
    !target ||
    !Array.isArray(target.ideal)
  ) {
    return STATUS.UNKNOWN;
  }
  const tol = target.tolerance ?? 0.5;
  const [a, b, c] = sortedSides;
  const ok =
    Math.abs(a - target.ideal[0]) <= tol &&
    Math.abs(b - target.ideal[1]) <= tol &&
    Math.abs(c - target.ideal[2]) <= tol;
  return ok ? STATUS.IN_RANGE : STATUS.ABOVE;
}

/**
 * Универсальная оценка против стандарта.
 *
 * @param {Object} args
 * @param {Object} args.measurements      - map { key → { value, unit, ... } }
 * @param {string} args.standardId
 * @returns {Array<{key, label, value, unit, target, status, deviation, source}>}
 */
export function evaluateAgainstStandard({ measurements = {}, standardId }) {
  const standard = getStandardById(standardId);
  if (!standard) return [];

  const results = [];

  for (const [key, target] of Object.entries(standard.targets)) {
    const measurement = measurements[key];

    if (!measurement) {
      results.push({
        key,
        label: target.label,
        value: null,
        formatted: undefined,
        unit: target.unit,
        target,
        status: STATUS.UNKNOWN,
        deviation: null,
        source: standard.source,
      });
      continue;
    }

    let status;
    let deviation = null;

    if (key === "crumleyTriangle") {
      const sides = Array.isArray(measurement.value) ? measurement.value : null;
      status = evaluateCrumley(sides, target);
      if (sides && Array.isArray(target.ideal)) {
        deviation = sides.map((v, i) => v - target.ideal[i]);
      }
    } else {
      const v = measurement.value;
      status = evaluateScalar(v, target);
      if (
        typeof v === "number" &&
        Number.isFinite(v) &&
        typeof target.ideal === "number"
      ) {
        deviation = v - target.ideal;
      }
    }

    results.push({
      key,
      label: target.label,
      value: measurement.value,
      formatted: measurement.formatted,
      unit: target.unit,
      target,
      status,
      deviation,
      source: standard.source,
    });
  }

  return results;
}

export function summarizeEvaluation(results) {
  const summary = { total: 0, inRange: 0, deviations: 0, unknown: 0 };
  for (const r of results) {
    summary.total += 1;
    if (r.status === STATUS.IN_RANGE) summary.inRange += 1;
    else if (r.status === STATUS.UNKNOWN) summary.unknown += 1;
    else summary.deviations += 1;
  }
  return summary;
}
