// src/pages/simulation/standards/canonical/canonicalSolver.js
//
// CANONICAL FACE SOLVER
// =====================================================================
//
// Алгоритм:
//   1. Берём canonical face (IDEAL_FEMALE/IDEAL_MALE)
//   2. Извлекаем из landmarks пациента «опорный треугольник»
//      (glabella, subnasale, menton — главная ось лица + ширина)
//   3. Procrustes 2D similarity transform (scale + rotation + translation):
//      переносим canonical в координаты пациента
//   4. Для каждой точки canonical вычисляем целевую позицию в норм. координатах
//   5. Возвращаем displacements: {from: current_landmark, to: target}
//
// PROCRUSTES (Umeyama 1991, 2D similarity):
//   src: canonical points (3 anchors)
//   dst: patient landmarks at same 3 anchors
//   → находим (s, R, t): dst_i ≈ s · R · src_i + t
//
// SOLVER возвращает displacements для всех точек canonical, у которых
// есть соответствующий landmark у пациента и расстояние > MIN_THRESHOLD.

import { distance2D } from "../../mediapipe/measurements.js";
import { getIdealFace } from "./idealFace.js";

const MIN_DISPLACEMENT = 0.002; // 0.2% от ширины фото — ниже игнорируем
const MAX_DISPLACEMENT = 0.1; // 10% — анатомический предел

/* ────── Helpers ────── */

function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

function clonePoint(p) {
  return { x: p.x, y: p.y };
}

function clampDisplacement(from, to, maxNorm) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= maxNorm) return to;
  const scale = maxNorm / len;
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

/**
 * 2D Procrustes (Umeyama). Находит similarity transform.
 *
 * @param {Array<{x,y}>} src — N точек источника (canonical)
 * @param {Array<{x,y}>} dst — N точек назначения (patient)
 * @returns {{ scale, rotation, tx, ty, transform } | null}
 */
function procrustes2D(src, dst) {
  if (src.length !== dst.length || src.length < 2) return null;
  const N = src.length;

  let cx = 0,
    cy = 0,
    px = 0,
    py = 0;
  for (let i = 0; i < N; i++) {
    cx += src[i].x;
    cy += src[i].y;
    px += dst[i].x;
    py += dst[i].y;
  }
  cx /= N;
  cy /= N;
  px /= N;
  py /= N;

  let Sxx = 0,
    Syx = 0,
    normSq = 0;
  for (let i = 0; i < N; i++) {
    const dxC = src[i].x - cx;
    const dyC = src[i].y - cy;
    const dxP = dst[i].x - px;
    const dyP = dst[i].y - py;
    Sxx += dxC * dxP + dyC * dyP;
    Syx += dxC * dyP - dyC * dxP;
    normSq += dxC * dxC + dyC * dyC;
  }
  if (normSq === 0) return null;

  const rotation = Math.atan2(Syx, Sxx);
  const scale = Math.sqrt(Sxx * Sxx + Syx * Syx) / normSq;
  if (!Number.isFinite(scale) || scale === 0) return null;

  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const tx = px - scale * (cosR * cx - sinR * cy);
  const ty = py - scale * (sinR * cx + cosR * cy);

  const transform = (p) => ({
    x: scale * (cosR * p.x - sinR * p.y) + tx,
    y: scale * (sinR * p.x + cosR * p.y) + ty,
  });

  return { scale, rotation, tx, ty, transform };
}

/* ────── Main ────── */

/**
 * Решает целевые landmark позиции на основе canonical idealFace.
 *
 * @param {Object} params
 * @param {Array}  params.landmarks — все landmarks пациента
 * @param {string} [params.sex='female']
 * @param {Object} [params.options]
 *   @param {string[]} [options.includeRoles] — список ролей точек для коррекции;
 *     если не задан — все доступные точки canonical mask
 *   @param {number}  [options.amplification=1.0] — усиление (для частичного эффекта)
 *
 * @returns {Array} displacements
 */
export function solveTargetFromCanonical({
  landmarks,
  sex = "female",
  options = {},
}) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("[canonicalSolver] no landmarks");
    return [];
  }

  const canonical = getIdealFace(sex);
  if (!canonical) {
    // eslint-disable-next-line no-console
    console.warn("[canonicalSolver] no canonical face for sex:", sex);
    return [];
  }

  const includeRoles = options.includeRoles ?? null;
  const amplification = options.amplification ?? 1.0;

  // ─── Шаг 1: Опорный треугольник ───
  // Используем 3 точки которые наиболее стабильны MediaPipe и
  // определяют ориентацию + размер лица:
  //   - glabella (середина бровей)
  //   - subnasale (основание носа)
  //   - menton (подбородок)
  // Это устойчиво к вариациям ширины, профиля, деформации носа,
  // и даёт нам main face axis.

  const anchorRoles = ["glabella", "subnasale", "menton"];
  const srcPoints = []; // в canonical face-relative
  const dstPoints = []; // в patient image-normalized

  for (const role of anchorRoles) {
    const cp = canonical.points[role];
    if (!cp) {
      // eslint-disable-next-line no-console
      console.warn(`[canonicalSolver] canonical has no role: ${role}`);
      return [];
    }
    const lm = findByIndex(landmarks, cp.mediapipeIndex);
    if (!lm) {
      // eslint-disable-next-line no-console
      console.warn(
        `[canonicalSolver] patient missing anchor: ${role} (mp index ${cp.mediapipeIndex})`,
      );
      return [];
    }
    srcPoints.push({ x: cp.x, y: cp.y });
    dstPoints.push({ x: lm.x, y: lm.y });
  }

  // ─── Шаг 2: Procrustes alignment ───
  const transform = procrustes2D(srcPoints, dstPoints);
  if (!transform) {
    // eslint-disable-next-line no-console
    console.warn("[canonicalSolver] procrustes failed");
    return [];
  }

  // eslint-disable-next-line no-console
  console.info(
    "[canonicalSolver]",
    "sex:",
    sex,
    "| scale:",
    transform.scale.toFixed(4),
    "| rotation:",
    ((transform.rotation * 180) / Math.PI).toFixed(2),
    "°",
    "| canonical:",
    canonical.id,
  );

  // ─── Шаг 3: Генерация displacements ───
  const displacements = [];

  for (const cp of Object.values(canonical.points)) {
    // Не трогаем anchor точки которые мы использовали для alignment
    // (иначе будет круговая логика)
    if (anchorRoles.includes(cp.role)) continue;

    // Фильтр по ролям если задан
    if (includeRoles && !includeRoles.includes(cp.role)) continue;

    const patientLm = findByIndex(landmarks, cp.mediapipeIndex);
    if (!patientLm) continue;

    // Целевая позиция в координатах пациента
    const idealPos = transform.transform({ x: cp.x, y: cp.y });

    // Применяем амплификацию (interpolation between current and ideal)
    const targetX = patientLm.x + (idealPos.x - patientLm.x) * amplification;
    const targetY = patientLm.y + (idealPos.y - patientLm.y) * amplification;

    const target = clampDisplacement(
      patientLm,
      { x: targetX, y: targetY },
      MAX_DISPLACEMENT,
    );

    const dist = distance2D(patientLm, target);
    if (dist < MIN_DISPLACEMENT) continue;

    displacements.push({
      mediapipeIndex: cp.mediapipeIndex,
      role: cp.role,
      from: clonePoint(patientLm),
      to: target,
      distance: dist,
      drivenBy: ["canonical"],
      idealPosition: idealPos,
    });
  }

  // eslint-disable-next-line no-console
  console.info(
    `[canonicalSolver] returning ${displacements.length} displacements:`,
    displacements.map((d) => ({
      role: d.role,
      distance: d.distance.toFixed(4),
    })),
  );

  return displacements;
}
