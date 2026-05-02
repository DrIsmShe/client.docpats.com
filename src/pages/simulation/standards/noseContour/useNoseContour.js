// src/pages/simulation/standards/noseContour/useNoseContour.js
//
// V2: Вручную создаём control points с per-point radius/strength,
// взятыми из displacement.customRadius / customStrength (solver их выставил).

import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectLandmarks } from "../../store/simulationSlice.js";
import { generateNoseContourPoints } from "./noseContourGenerator.js";
import { solveNoseContourMidline } from "./noseContourSolver.js";

const STANDARD_ID = "nose-contour-midline";

function isContourCp(cp) {
  const sid = cp?.meta?.standardId ?? cp?.standardId;
  return sid === STANDARD_ID;
}

let cpCounter = 0;
function generateKey(role) {
  cpCounter += 1;
  return `cp_contour_${role}_${Date.now().toString(36)}_${cpCounter}`;
}

/**
 * Создаёт control points напрямую из displacements,
 * используя custom radius/strength если заданы.
 */
function buildControlPoints(displacements, standardId) {
  if (!Array.isArray(displacements)) return [];
  const out = [];
  for (const d of displacements) {
    out.push({
      key: generateKey(d.role),
      anchor: { x: d.from.x, y: d.from.y },
      current: { x: d.to.x, y: d.to.y },
      radius: d.customRadius ?? 0.05,
      strength: d.customStrength ?? 1.0,
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
  return out;
}

export function useNoseContour({ points, commitPoints }) {
  const landmarks = useSelector(selectLandmarks);

  const [contourPoints, setContourPoints] = useState(null);
  const [anchors, setAnchors] = useState(null);

  const safePoints = useMemo(
    () => (Array.isArray(points) ? points : []),
    [points],
  );

  const hasAppliedContour = useMemo(
    () => safePoints.some(isContourCp),
    [safePoints],
  );

  const createContour = useCallback(() => {
    if (!Array.isArray(landmarks) || landmarks.length === 0) {
      return { success: false, reason: "no-landmarks" };
    }

    const result = generateNoseContourPoints(landmarks);
    if (!result) {
      return { success: false, reason: "missing-anchors" };
    }

    setContourPoints(result.points);
    setAnchors(result.anchors);

    // eslint-disable-next-line no-console
    console.info(
      "[useNoseContour V2] contour created:",
      result.points.length,
      "points",
    );

    return { success: true, count: result.points.length };
  }, [landmarks]);

  const applyContour = useCallback(() => {
    if (!contourPoints || !anchors) {
      return { success: false, reason: "no-contour" };
    }
    if (typeof commitPoints !== "function") {
      return { success: false, reason: "no-commit-fn" };
    }

    const displacements = solveNoseContourMidline(contourPoints, anchors);
    if (displacements.length === 0) {
      return { success: false, reason: "no-displacements" };
    }

    const newCps = buildControlPoints(displacements, STANDARD_ID);

    const preserved = safePoints.filter((cp) => !isContourCp(cp));
    const merged = [...preserved, ...newCps];

    // eslint-disable-next-line no-console
    console.info(
      "[useNoseContour V2] applying:",
      "displacements:",
      displacements.length,
      "| new CPs:",
      newCps.length,
      "| total:",
      merged.length,
    );

    commitPoints(merged, { action: "apply-nose-contour" });

    return { success: true, count: newCps.length };
  }, [contourPoints, anchors, safePoints, commitPoints]);

  const clearContour = useCallback(() => {
    if (typeof commitPoints !== "function") return;
    const filtered = safePoints.filter((cp) => !isContourCp(cp));
    commitPoints(filtered, { action: "clear-nose-contour" });
    setContourPoints(null);
    setAnchors(null);
  }, [safePoints, commitPoints]);

  return {
    createContour,
    applyContour,
    clearContour,
    contourPoints,
    hasContour: contourPoints !== null,
    hasAppliedContour,
  };
}
