// src/pages/simulation/standards/noseContour/noseContourSolver.js
//
// V2: Узкие радиусы и мягкая strength — не задевают щёки и губы.

import {
  isDorsumPoint,
  isAlarContourPoint,
  getAlarSide,
} from "./noseContourGenerator.js";

const MAX_DISPLACEMENT_NORM = 0.04;
const MIN_USEFUL_DISPLACEMENT = 0.0005;

// V2: разные параметры warp для разных типов точек
const DORSUM_RADIUS = 0.04; // узкая зона по спинке (было 0.08)
const DORSUM_STRENGTH = 0.85;
const ALAR_RADIUS = 0.025; // очень узкая зона у каждой точки крыла (было 0.07)
const ALAR_STRENGTH = 0.6; // мягче — крылья чувствительнее к деформации

function clampDisplacement(from, to, maxNorm) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= maxNorm) return to;
  const scale = maxNorm / len;
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

function distance2D(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function solveNoseContourMidline(contourPoints, anchors) {
  if (!Array.isArray(contourPoints) || contourPoints.length === 0) {
    return [];
  }

  const { glabella, alarL, alarR } = anchors || {};

  let idealMidlineX;
  if (glabella && alarL && alarR) {
    const alarMidX = (alarL.x + alarR.x) / 2;
    idealMidlineX = (glabella.x + alarMidX) / 2;
  } else if (alarL && alarR) {
    idealMidlineX = (alarL.x + alarR.x) / 2;
  } else if (glabella) {
    idealMidlineX = glabella.x;
  } else {
    return [];
  }

  // eslint-disable-next-line no-console
  console.info(
    "[noseContourSolver V2] idealMidlineX:",
    idealMidlineX.toFixed(4),
    "| total points:",
    contourPoints.length,
  );

  const displacements = [];

  // ─── DORSUM ───
  for (const pt of contourPoints) {
    if (!isDorsumPoint(pt.role)) continue;

    const from = { x: pt.x, y: pt.y };
    const targetIdeal = { x: idealMidlineX, y: pt.y };
    const to = clampDisplacement(from, targetIdeal, MAX_DISPLACEMENT_NORM);
    const dist = distance2D(from, to);

    if (dist < MIN_USEFUL_DISPLACEMENT) continue;

    displacements.push({
      role: pt.role,
      from,
      to,
      distance: dist,
      mediapipeIndex: null,
      // V2: специальные параметры для спинки
      customRadius: DORSUM_RADIUS,
      customStrength: DORSUM_STRENGTH,
    });
  }

  // ─── ALAR CONTOUR — симметричные пары ───
  const leftPoints = new Map();
  const rightPoints = new Map();
  for (const pt of contourPoints) {
    if (!isAlarContourPoint(pt.role)) continue;
    const side = getAlarSide(pt.role);
    const idx = parseInt(pt.role.split("_").pop(), 10);
    if (side === "left") leftPoints.set(idx, pt);
    else if (side === "right") rightPoints.set(idx, pt);
  }

  for (const [idx, leftPt] of leftPoints.entries()) {
    const rightPt = rightPoints.get(idx);
    if (!rightPt) continue;

    const distLeft = idealMidlineX - leftPt.x;
    const distRight = rightPt.x - idealMidlineX;
    const meanDist = (distLeft + distRight) / 2;

    const idealLeftX = idealMidlineX - meanDist;
    const idealRightX = idealMidlineX + meanDist;
    const idealY = (leftPt.y + rightPt.y) / 2;

    const fromLeft = { x: leftPt.x, y: leftPt.y };
    const toLeft = clampDisplacement(
      fromLeft,
      { x: idealLeftX, y: idealY },
      MAX_DISPLACEMENT_NORM,
    );
    const distL = distance2D(fromLeft, toLeft);
    if (distL >= MIN_USEFUL_DISPLACEMENT) {
      displacements.push({
        role: leftPt.role,
        from: fromLeft,
        to: toLeft,
        distance: distL,
        mediapipeIndex: null,
        customRadius: ALAR_RADIUS,
        customStrength: ALAR_STRENGTH,
      });
    }

    const fromRight = { x: rightPt.x, y: rightPt.y };
    const toRight = clampDisplacement(
      fromRight,
      { x: idealRightX, y: idealY },
      MAX_DISPLACEMENT_NORM,
    );
    const distR = distance2D(fromRight, toRight);
    if (distR >= MIN_USEFUL_DISPLACEMENT) {
      displacements.push({
        role: rightPt.role,
        from: fromRight,
        to: toRight,
        distance: distR,
        mediapipeIndex: null,
        customRadius: ALAR_RADIUS,
        customStrength: ALAR_STRENGTH,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.info(`[noseContourSolver V2] ${displacements.length} displacements`, {
    dorsum: displacements.filter((d) => isDorsumPoint(d.role)).length,
    alar: displacements.filter((d) => isAlarContourPoint(d.role)).length,
  });

  return displacements;
}
