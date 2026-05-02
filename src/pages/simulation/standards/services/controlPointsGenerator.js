// src/pages/simulation/standards/services/controlPointsGenerator.js
//
// V10: Радиусы подобраны под Liquify warp engine.
//
// КЛЮЧЕВОЙ ВЫВОД: warp engine складывает вклады всех точек АДДИТИВНО.
// Точки на спинке носа должны ПЕРЕКРЫВАТЬСЯ по радиусам, чтобы их
// сложение давало непрерывную деформацию вдоль линии.
//
// 5 точек на дорсуме (расстояние между nasion и pronasale в нормированных
// координатах ~0.20). Шаг между точками 0.20/4 = 0.05.
// → radius каждой точки 0.08 даёт перекрытие 0.06 (75%).
//
// Для других ролей (alar, mouth, eyes) — 0.06-0.08, как в breast.

import { distance2D } from "../../mediapipe/measurements.js";

const DEFAULT_RADIUS = 0.08;
const DEFAULT_STRENGTH = 1.0;
const MIN_DISPLACEMENT = 0.001;

const ROLE_RADIUS = {
  // Dorsum — большие перекрывающиеся радиусы для непрерывной коррекции
  nasion: 0.08,
  pronasale: 0.08,
  dorsum_t0: 0.08,
  dorsum_t1: 0.08,
  dorsum_t2: 0.08,
  dorsum_t3: 0.08,
  dorsum_t4: 0.08,
  dorsum_t5: 0.08,
  dorsum_t6: 0.08,

  // Wings of nose
  alarL: 0.07,
  alarR: 0.07,
  alarLeft: 0.07,
  alarRight: 0.07,

  // Anchors
  trichion: 0.08,
  glabella: 0.08,
  subnasale: 0.08,
  chin: 0.08,

  // Eyes / mouth
  canthusInnerLeft: 0.06,
  canthusInnerRight: 0.06,
  canthusOuterLeft: 0.07,
  canthusOuterRight: 0.07,
  mouthCornerLeft: 0.07,
  mouthCornerRight: 0.07,
};

let cpCounter = 0;
function generateKey(role) {
  cpCounter += 1;
  return `cp_std_${role}_${Date.now().toString(36)}_${cpCounter}`;
}

export function generateControlPoints({
  displacements,
  standardId,
  options = {},
}) {
  if (!Array.isArray(displacements) || displacements.length === 0) return [];

  const points = [];

  for (const d of displacements) {
    if (d.distance < MIN_DISPLACEMENT) continue;

    const radius = options.radius ?? ROLE_RADIUS[d.role] ?? DEFAULT_RADIUS;
    const strength = options.strength ?? DEFAULT_STRENGTH;

    points.push({
      key: generateKey(d.role),
      anchor: { x: d.from.x, y: d.from.y },
      current: { x: d.to.x, y: d.to.y },
      radius,
      strength,
      meta: {
        source: "standard",
        standardId,
        role: d.role,
        mediapipeIndex: d.mediapipeIndex,
      },
      source: "standard",
      standardId,
    });
  }

  return points;
}

export function sanitizeForBackend(cp) {
  if (!cp) return cp;
  const { key, anchor, current, radius, strength } = cp;
  return { key, anchor, current, radius, strength };
}

export function sanitizeArrayForBackend(points) {
  if (!Array.isArray(points)) return [];
  return points.map(sanitizeForBackend);
}

export function isStandardCp(cp, standardId = null) {
  if (!cp) return false;
  const cpStandardId = cp?.meta?.standardId ?? cp?.standardId;
  const cpSource = cp?.meta?.source ?? cp?.source;
  if (cpSource !== "standard") return false;
  if (standardId && cpStandardId !== standardId) return false;
  return true;
}

export function summarizeControlPoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { count: 0, totalDistance: 0, byRole: {} };
  }

  const byRole = {};
  let totalDistance = 0;

  for (const p of points) {
    const role = p?.meta?.role ?? p?.role ?? "unknown";
    if (!byRole[role]) byRole[role] = 0;
    byRole[role] += 1;
    totalDistance += distance2D(p.anchor, p.current);
  }

  return { count: points.length, totalDistance, byRole };
}
