// src/pages/anthropometry/utils/annotationHelpers.js

/* ─── Генерация уникальных ключей ─── */
let _lmCounter = 0;
let _mCounter = 0;

export const generateLandmarkKey = () => {
  _lmCounter += 1;
  return `lm_${Date.now()}_${_lmCounter}`;
};

export const generateMeasurementKey = () => {
  _mCounter += 1;
  return `m_${Date.now()}_${_mCounter}`;
};

/* ─── Clamp landmark в [0..1] ─── */
export const clampLandmark = (x, y) => ({
  x: Math.max(0, Math.min(1, x)),
  y: Math.max(0, Math.min(1, y)),
});

/* ─── Distance (результат в mm если есть pixelsPerMm, иначе px) ─── */
export const computeDistance = (lm1, lm2, imgW, imgH, pixelsPerMm) => {
  const dx = (lm1.x - lm2.x) * imgW;
  const dy = (lm1.y - lm2.y) * imgH;
  const distPx = Math.sqrt(dx * dx + dy * dy);
  if (pixelsPerMm && pixelsPerMm > 0) {
    return { value: distPx / pixelsPerMm, unit: "mm" };
  }
  return { value: distPx, unit: "px" };
};

/* ─── Angle (в градусах) между тремя точками. lm2 — vertex. ─── */
export const computeAngle = (lm1, lm2, lm3, imgW, imgH) => {
  /* Все в "фото-пикселях" чтобы учесть aspect ratio */
  const ax = (lm1.x - lm2.x) * imgW;
  const ay = (lm1.y - lm2.y) * imgH;
  const bx = (lm3.x - lm2.x) * imgW;
  const by = (lm3.y - lm2.y) * imgH;

  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return { value: 0, unit: "deg" };

  const cos = Math.max(-1, Math.min(1, dot / (magA / 1) / magB));
  const angleRad = Math.acos(cos);
  return { value: (angleRad * 180) / Math.PI, unit: "deg" };
};

/* ─── Format number for display ─── */
export const formatMeasurement = (value, unit) => {
  if (unit === "mm") return `${value.toFixed(1)} мм`;
  if (unit === "px") return `${Math.round(value)} px`;
  if (unit === "deg") return `${value.toFixed(1)}°`;
  return `${value}`;
};

/* ─── Midpoint на отрезке (для позиционирования label) ─── */
export const midpointScreen = (p1, p2, imgW, imgH) => ({
  x: ((p1.x + p2.x) / 2) * imgW,
  y: ((p1.y + p2.y) / 2) * imgH,
});
