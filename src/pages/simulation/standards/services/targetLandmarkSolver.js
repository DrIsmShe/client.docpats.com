// src/pages/simulation/standards/services/targetLandmarkSolver.js
//
// V13: Снижена амплификация до пропорциональной (V13 пере-сдвигал).
// (см. utils/warpMath.js).
//
// КЛЮЧЕВЫЕ ВЫВОДЫ из изучения warpMath.js + breastWarpGenerator.js:
//
// 1. Смещение в breast generator = 0.05 (5% от ширины фото).
//    Маленькие смещения (~0.005) дают сдвиг < 1 пикселя.
//    → ИСПОЛЬЗУЕМ displacement не меньше 0.03-0.05.
//
// 2. Радиус в breast = 0.05-0.10 (нормализованный).
//    → Те же радиусы используем здесь.
//
// 3. strength всегда = 1.0 (добавлен умножитель сразу в displacement).
//
// 4. Warp АДДИТИВНО складывает вклады нескольких точек.
//    → Точки на спинке должны перекрываться по радиусам, чтобы
//      их сложение давало плавную линию деформации.
//
// 5. ВАЖНО: anchor = ТЕКУЩАЯ позиция (искривлённая спинка),
//    current = ЦЕЛЬ (midline). dispX = current - anchor.
//    Inverse mapping тащит пиксели в направлении -displacement,
//    т.е. от current к anchor. Это значит:
//      "Пиксели вокруг anchor поплывут к current"
//    что нам и нужно: пиксели искривлённой спинки → к midline.

import { distance2D } from "../../mediapipe/measurements.js";

const MAX_DISPLACEMENT_NORM = 0.05;
const MIN_USEFUL_DISPLACEMENT = 0.001;
const MAX_ITERATIONS = 80;
const LEARNING_RATE = 1e-4;
const CONVERGENCE_TOL_DEG = 0.5;
const GRAD_EPSILON = 1e-4;

const AMP_PROFILE = 4;
const AMP_FRONTAL = 3;

// V13: AMP_DORSUM = 4 (V13=6 немного сильно, V11=2 мало).
const AMP_DORSUM = 4;

const DORSUM_SAMPLE_COUNT = 5; // 5 точек дают хорошее перекрытие радиусов

const IDX = {
  GLABELLA: 9,
  NASION: 168,
  PRONASALE: 1,
  ALAR_L: 129,
  ALAR_R: 358,
  CHIN: 152,
  CANTHUS_INNER_L: 133,
  CANTHUS_INNER_R: 362,
  MOUTH_CORNER_L: 61,
  MOUTH_CORNER_R: 291,
};

/* ────── Helpers ────── */

function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

function clonePoint(p) {
  return { x: p.x, y: p.y };
}

function angleAtVertex(A, B, C) {
  const v1x = A.x - B.x,
    v1y = A.y - B.y;
  const v2x = C.x - B.x,
    v2y = C.y - B.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 === 0 || len2 === 0) return null;
  const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function angleBetweenVectors(p1Start, p1End, p2Start, p2End) {
  const v1x = p1End.x - p1Start.x,
    v1y = p1End.y - p1Start.y;
  const v2x = p2End.x - p2Start.x,
    v2y = p2End.y - p2Start.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 === 0 || len2 === 0) return null;
  const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

function clampDisplacement(from, to, maxNorm) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= maxNorm) return to;
  const scale = maxNorm / len;
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

function amplify(from, to, amp) {
  return {
    x: from.x + (to.x - from.x) * amp,
    y: from.y + (to.y - from.y) * amp,
  };
}

function gradientDescent2D(initial, errorFn, convergedFn) {
  let pos = clonePoint(initial);
  let learningRate = LEARNING_RATE;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    if (convergedFn(pos)) break;
    const ex1 = errorFn({ x: pos.x + GRAD_EPSILON, y: pos.y });
    const ex0 = errorFn({ x: pos.x - GRAD_EPSILON, y: pos.y });
    const ey1 = errorFn({ x: pos.x, y: pos.y + GRAD_EPSILON });
    const ey0 = errorFn({ x: pos.x, y: pos.y - GRAD_EPSILON });
    const gx = (ex1 - ex0) / (2 * GRAD_EPSILON);
    const gy = (ey1 - ey0) / (2 * GRAD_EPSILON);
    const next = { x: pos.x - learningRate * gx, y: pos.y - learningRate * gy };
    if (errorFn(next) >= errorFn(pos)) {
      learningRate *= 0.5;
      if (learningRate < 1e-7) break;
      continue;
    }
    pos = next;
  }
  return pos;
}

function projectOntoLine(P, A, B) {
  const dx = B.x - A.x,
    dy = B.y - A.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return clonePoint(A);
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
  return { x: A.x + t * dx, y: A.y + t * dy };
}

/* ────── PROFILE solvers ────── */

function solveNasofrontal(pts, targetDeg) {
  const { glabella, nasion, pronasale } = pts;
  const errorFn = (N) => {
    const a = angleAtVertex(glabella, N, pronasale);
    return a == null ? Infinity : (a - targetDeg) ** 2;
  };
  const converged = (N) => {
    const a = angleAtVertex(glabella, N, pronasale);
    return a != null && Math.abs(a - targetDeg) < CONVERGENCE_TOL_DEG;
  };
  const optimized = gradientDescent2D(nasion, errorFn, converged);
  return clampDisplacement(
    nasion,
    amplify(nasion, optimized, AMP_PROFILE),
    MAX_DISPLACEMENT_NORM,
  );
}

function solveNasofacial(pts, targetDeg) {
  const { glabella, chin, nasion, pronasale } = pts;
  const errorFn = (T) => {
    const a = angleBetweenVectors(glabella, chin, nasion, T);
    return a == null ? Infinity : (a - targetDeg) ** 2;
  };
  const converged = (T) => {
    const a = angleBetweenVectors(glabella, chin, nasion, T);
    return a != null && Math.abs(a - targetDeg) < CONVERGENCE_TOL_DEG;
  };
  const optimized = gradientDescent2D(pronasale, errorFn, converged);
  return clampDisplacement(
    pronasale,
    amplify(pronasale, optimized, AMP_PROFILE),
    MAX_DISPLACEMENT_NORM,
  );
}

function solveGoode(pts, targetRatio) {
  const { alarMid, pronasale, nasion } = pts;
  const refLen = distance2D(alarMid, nasion);
  if (refLen === 0) return clonePoint(pronasale);
  const targetLen = targetRatio * refLen;
  const dx = pronasale.x - alarMid.x,
    dy = pronasale.y - alarMid.y;
  const cur = Math.hypot(dx, dy);
  if (cur === 0) return clonePoint(pronasale);
  const candidate = {
    x: alarMid.x + (dx / cur) * targetLen,
    y: alarMid.y + (dy / cur) * targetLen,
  };
  return clampDisplacement(
    pronasale,
    amplify(pronasale, candidate, AMP_PROFILE),
    MAX_DISPLACEMENT_NORM,
  );
}

/* ────── FRONTAL solvers ────── */

function solveAlarWidthRatio(alarL, alarR, targetRatio, referenceWidth) {
  const targetAlarWidth = targetRatio * referenceWidth;
  const currentAlarWidth = distance2D(alarL, alarR);
  if (currentAlarWidth === 0)
    return { alarL: clonePoint(alarL), alarR: clonePoint(alarR) };

  const cx = (alarL.x + alarR.x) / 2;
  const cy = (alarL.y + alarR.y) / 2;
  const scale = targetAlarWidth / currentAlarWidth;

  const idealAlarL = {
    x: cx + (alarL.x - cx) * scale,
    y: cy + (alarL.y - cy) * scale,
  };
  const idealAlarR = {
    x: cx + (alarR.x - cx) * scale,
    y: cy + (alarR.y - cy) * scale,
  };

  return {
    alarL: clampDisplacement(
      alarL,
      amplify(alarL, idealAlarL, AMP_FRONTAL),
      MAX_DISPLACEMENT_NORM,
    ),
    alarR: clampDisplacement(
      alarR,
      amplify(alarR, idealAlarR, AMP_FRONTAL),
      MAX_DISPLACEMENT_NORM,
    ),
  };
}

/**
 * V13: Параметры под Liquify warp.
 *
 * 5 точек, равномерно от nasion до pronasale.
 * AMP_DORSUM = 20 → если искривление 0.005, target смещение = 0.10
 * (clamp). Warp engine увидит RealnoeReally видимое движение.
 */
function solveDorsumMidline(landmarks, glabella, chin, alarL, alarR) {
  const nasion = findByIndex(landmarks, IDX.NASION);
  const pronasale = findByIndex(landmarks, IDX.PRONASALE);
  if (!nasion || !pronasale) return [];

  let idealMidlineX;
  if (alarL && alarR) {
    const alarMidX = (alarL.x + alarR.x) / 2;
    idealMidlineX = (glabella.x + alarMidX) / 2;
  } else {
    idealMidlineX = (glabella.x + chin.x) / 2;
  }

  // eslint-disable-next-line no-console
  console.info(
    "[solveDorsumMidline V13] nasion:",
    `(${nasion.x.toFixed(4)}, ${nasion.y.toFixed(4)})`,
    "pronasale:",
    `(${pronasale.x.toFixed(4)}, ${pronasale.y.toFixed(4)})`,
    "idealMidlineX:",
    idealMidlineX.toFixed(4),
    "AMP:",
    AMP_DORSUM,
  );

  const result = [];

  for (let i = 0; i < DORSUM_SAMPLE_COUNT; i++) {
    const t = i / (DORSUM_SAMPLE_COUNT - 1);

    const anchorX = nasion.x + (pronasale.x - nasion.x) * t;
    const anchorY = nasion.y + (pronasale.y - nasion.y) * t;

    const targetX = idealMidlineX;
    const targetY = anchorY;

    const from = { x: anchorX, y: anchorY };
    const amplified = amplify(from, { x: targetX, y: targetY }, AMP_DORSUM);
    const to = clampDisplacement(from, amplified, MAX_DISPLACEMENT_NORM);

    result.push({
      mediapipeIndex: null,
      role: `dorsum_t${i}`,
      from,
      to,
    });
  }

  return result;
}

function solveAlarSymmetry(alarL, alarR, glabella, chin) {
  const projL = projectOntoLine(alarL, glabella, chin);
  const projR = projectOntoLine(alarR, glabella, chin);
  const distL = distance2D(alarL, projL);
  const distR = distance2D(alarR, projR);
  const meanDist = (distL + distR) / 2;

  const unitLx = (alarL.x - projL.x) / (distL || 1);
  const unitLy = (alarL.y - projL.y) / (distL || 1);
  const unitRx = (alarR.x - projR.x) / (distR || 1);
  const unitRy = (alarR.y - projR.y) / (distR || 1);

  const idealAlarL = {
    x: projL.x + unitLx * meanDist,
    y: projL.y + unitLy * meanDist,
  };
  const idealAlarR = {
    x: projR.x + unitRx * meanDist,
    y: projR.y + unitRy * meanDist,
  };

  return {
    alarL: clampDisplacement(
      alarL,
      amplify(alarL, idealAlarL, AMP_FRONTAL),
      MAX_DISPLACEMENT_NORM,
    ),
    alarR: clampDisplacement(
      alarR,
      amplify(alarR, idealAlarR, AMP_FRONTAL),
      MAX_DISPLACEMENT_NORM,
    ),
  };
}

/* ────── Main entry ────── */

export function solveTargetLandmarks({ landmarks, standard }) {
  if (!Array.isArray(landmarks) || !standard?.targets) return [];

  const glabella = findByIndex(landmarks, IDX.GLABELLA);
  const nasion = findByIndex(landmarks, IDX.NASION);
  const pronasale = findByIndex(landmarks, IDX.PRONASALE);
  const alarL = findByIndex(landmarks, IDX.ALAR_L);
  const alarR = findByIndex(landmarks, IDX.ALAR_R);
  const chin = findByIndex(landmarks, IDX.CHIN);
  const innerL = findByIndex(landmarks, IDX.CANTHUS_INNER_L);
  const innerR = findByIndex(landmarks, IDX.CANTHUS_INNER_R);
  const mouthL = findByIndex(landmarks, IDX.MOUTH_CORNER_L);
  const mouthR = findByIndex(landmarks, IDX.MOUTH_CORNER_R);

  // eslint-disable-next-line no-console
  console.info(
    "[solveTargetLandmarks V13] standard:",
    standard.id,
    "| targets:",
    Object.keys(standard.targets),
  );

  if (!glabella || !nasion || !pronasale) return [];

  const alarMid =
    alarL && alarR
      ? { x: (alarL.x + alarR.x) / 2, y: (alarL.y + alarR.y) / 2 }
      : null;

  const movementsByMpIndex = new Map();
  const syntheticMovements = [];

  const addMovement = (mediapipeIndex, role, from, candidate, drivenBy) => {
    if (mediapipeIndex == null) {
      syntheticMovements.push({
        mediapipeIndex: null,
        role,
        from: clonePoint(from),
        to: candidate,
        drivenBy: [drivenBy],
      });
      return;
    }
    const entry = movementsByMpIndex.get(mediapipeIndex) || {
      role,
      from: clonePoint(from),
      candidates: [],
      drivenBy: [],
    };
    entry.candidates.push(candidate);
    entry.drivenBy.push(drivenBy);
    movementsByMpIndex.set(mediapipeIndex, entry);
  };

  for (const [key, target] of Object.entries(standard.targets)) {
    const ideal = target.ideal;

    if (key === "nasofrontalAngle") {
      const newNasion = solveNasofrontal(
        { glabella, nasion, pronasale },
        ideal,
      );
      addMovement(IDX.NASION, "nasion", nasion, newNasion, key);
    } else if (key === "nasofacialAngle") {
      if (!chin) continue;
      const newPronasale = solveNasofacial(
        { glabella, chin, nasion, pronasale },
        ideal,
      );
      addMovement(IDX.PRONASALE, "pronasale", pronasale, newPronasale, key);
    } else if (key === "goodeProjection") {
      if (!alarMid) continue;
      const newPronasale = solveGoode({ alarMid, pronasale, nasion }, ideal);
      addMovement(IDX.PRONASALE, "pronasale", pronasale, newPronasale, key);
    } else if (key === "crumleyTriangle") {
      continue;
    } else if (key === "alarToCanthalRatio") {
      if (!alarL || !alarR || !innerL || !innerR) continue;
      const refWidth = distance2D(innerL, innerR);
      const result = solveAlarWidthRatio(alarL, alarR, ideal, refWidth);
      addMovement(IDX.ALAR_L, "alarL", alarL, result.alarL, key);
      addMovement(IDX.ALAR_R, "alarR", alarR, result.alarR, key);
    } else if (key === "nasalToMouthRatio") {
      if (!alarL || !alarR || !mouthL || !mouthR) continue;
      const refWidth = distance2D(mouthL, mouthR);
      const result = solveAlarWidthRatio(alarL, alarR, ideal, refWidth);
      addMovement(IDX.ALAR_L, "alarL", alarL, result.alarL, key);
      addMovement(IDX.ALAR_R, "alarR", alarR, result.alarR, key);
    } else if (key === "midlineDeviation") {
      if (!chin) continue;
      const dorsumMovements = solveDorsumMidline(
        landmarks,
        glabella,
        chin,
        alarL,
        alarR,
      );
      // eslint-disable-next-line no-console
      console.info(
        `[midlineDeviation V13] dorsum sample points: ${dorsumMovements.length}`,
        dorsumMovements.map((m) => ({
          role: m.role,
          fromX: m.from.x.toFixed(4),
          toX: m.to.x.toFixed(4),
          deltaX: (m.to.x - m.from.x).toFixed(4),
        })),
      );
      for (const m of dorsumMovements) {
        addMovement(m.mediapipeIndex, m.role, m.from, m.to, key);
      }
    } else if (key === "alarSymmetry") {
      if (!alarL || !alarR || !chin) continue;
      const result = solveAlarSymmetry(alarL, alarR, glabella, chin);
      addMovement(IDX.ALAR_L, "alarL", alarL, result.alarL, key);
      addMovement(IDX.ALAR_R, "alarR", alarR, result.alarR, key);
    }
  }

  const displacements = [];

  for (const [mediapipeIndex, entry] of movementsByMpIndex.entries()) {
    if (entry.candidates.length === 0) continue;
    const avgX =
      entry.candidates.reduce((s, c) => s + c.x, 0) / entry.candidates.length;
    const avgY =
      entry.candidates.reduce((s, c) => s + c.y, 0) / entry.candidates.length;
    const to = clampDisplacement(
      entry.from,
      { x: avgX, y: avgY },
      MAX_DISPLACEMENT_NORM,
    );
    const dist = distance2D(entry.from, to);
    if (dist < MIN_USEFUL_DISPLACEMENT) continue;
    displacements.push({
      mediapipeIndex,
      role: entry.role,
      from: entry.from,
      to,
      distance: dist,
      drivenBy: entry.drivenBy,
    });
  }

  for (const m of syntheticMovements) {
    const dist = distance2D(m.from, m.to);
    if (dist < MIN_USEFUL_DISPLACEMENT) continue;
    displacements.push({
      mediapipeIndex: null,
      role: m.role,
      from: m.from,
      to: m.to,
      distance: dist,
      drivenBy: m.drivenBy,
    });
  }

  // eslint-disable-next-line no-console
  console.info(
    `[solveTargetLandmarks V13] returning ${displacements.length} displacements:`,
    displacements.map((d) => ({
      role: d.role,
      distance: d.distance.toFixed(4),
    })),
  );

  return displacements;
}

export function applyDisplacementsToLandmarks(landmarks, displacements) {
  if (!Array.isArray(landmarks)) return [];
  if (!displacements || displacements.length === 0) return landmarks;
  const map = new Map(
    displacements
      .filter((d) => d.mediapipeIndex != null)
      .map((d) => [d.mediapipeIndex, d.to]),
  );
  return landmarks.map((lm) => {
    const newPos = map.get(lm.mediapipeIndex);
    return newPos ? { ...lm, x: newPos.x, y: newPos.y } : lm;
  });
}
