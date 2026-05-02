// src/pages/simulation/standards/services/extendedMeasurements.js
//
// Дополнительные измерения для лица, которых нет в основном
// mediapipe/measurements.js и которые требуются стандартами:
//
//   - Nasofacial angle  (Powell-Humphrey)
//   - Crumley triangle  (3:4:5)
//
// Использует те же canonical anchor points что и основная система.

import { distance2D } from "../../mediapipe/measurements.js";

const IDX = {
  GLABELLA: 9,
  NASION: 168,
  PRONASALE: 1,
  ALAR_L: 129,
  ALAR_R: 358,
  CHIN: 152, // pogonion approximation
};

function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

export function computeNasofacialAngle(landmarks) {
  const G = findByIndex(landmarks, IDX.GLABELLA);
  const P = findByIndex(landmarks, IDX.CHIN);
  const N = findByIndex(landmarks, IDX.NASION);
  const T = findByIndex(landmarks, IDX.PRONASALE);
  if (!G || !P || !N || !T) return null;

  const v1x = P.x - G.x;
  const v1y = P.y - G.y;
  const v2x = T.x - N.x;
  const v2y = T.y - N.y;

  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 === 0 || len2 === 0) return null;

  const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
  const clamped = Math.max(-1, Math.min(1, cos));
  const value = (Math.acos(clamped) * 180) / Math.PI;

  return {
    value,
    points: { glabella: G, pogonion: P, nasion: N, pronasale: T },
    inNormalRange: value >= 30 && value <= 40,
  };
}

export function computeCrumleyTriangle(landmarks) {
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  const tip = findByIndex(landmarks, IDX.PRONASALE);
  const nasion = findByIndex(landmarks, IDX.NASION);
  if (!alarL || !alarR || !tip || !nasion) return null;

  const alarMid = {
    x: (alarL.x + alarR.x) / 2,
    y: (alarL.y + alarR.y) / 2,
  };

  const a = distance2D(nasion, tip);
  const b = distance2D(alarMid, tip);
  const c = distance2D(alarMid, nasion);

  const min = Math.min(a, b, c);
  if (min === 0) return null;

  const sortedRaw = [a, b, c].sort((x, y) => x - y);
  const sortedNormalized = sortedRaw.map((s) => (s / min) * 3);

  const tol = 0.5;
  const inRange =
    Math.abs(sortedNormalized[0] - 3) <= tol &&
    Math.abs(sortedNormalized[1] - 4) <= tol &&
    Math.abs(sortedNormalized[2] - 5) <= tol;

  return {
    value: sortedNormalized,
    raw: { a, b, c },
    points: { alarMid, tip, nasion },
    formatted: `${sortedNormalized[0].toFixed(2)} : ${sortedNormalized[1].toFixed(2)} : ${sortedNormalized[2].toFixed(2)}`,
    inNormalRange: inRange,
  };
}

export function computeExtendedMeasurements(landmarks) {
  return {
    nasofacialAngle: computeNasofacialAngle(landmarks),
    crumleyTriangle: computeCrumleyTriangle(landmarks),
  };
}
