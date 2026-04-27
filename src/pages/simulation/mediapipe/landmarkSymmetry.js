// client/src/pages/simulation/mediapipe/landmarkSymmetry.js
//
// Утилиты для symmetry mirror:
// 1. Вычисление вертикальной оси симметрии лица (по носу).
// 2. Зеркальное отражение точки относительно оси.

import { NAMED_LANDMARK_SETS } from "./faceLandmarksGroups";

/**
 * Вычисляет вертикальную ось симметрии лица как X-координату,
 * усреднённую по точкам средней линии носа (bridge + tip).
 *
 * @param {Array<{mediapipeIndex: number, x: number}>} landmarks
 * @returns {number|null}  X в normalized [0..1] или null если точек нет
 */
export function computeSymmetryAxisX(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;

  const midlineIndices = new Set([
    ...NAMED_LANDMARK_SETS.nose.bridge,
    ...NAMED_LANDMARK_SETS.nose.tip,
  ]);

  const midlinePoints = landmarks.filter((lm) =>
    midlineIndices.has(lm.mediapipeIndex),
  );
  if (midlinePoints.length === 0) return null;

  const sum = midlinePoints.reduce((acc, p) => acc + p.x, 0);
  return sum / midlinePoints.length;
}

/**
 * Зеркалит точку относительно вертикальной оси.
 *
 * @param {{x: number, y: number}} point
 * @param {number} axisX  X-координата оси симметрии [0..1]
 * @returns {{x: number, y: number}}
 */
export function mirrorPointHorizontal(point, axisX) {
  return {
    ...point,
    x: 2 * axisX - point.x,
    y: point.y,
  };
}
