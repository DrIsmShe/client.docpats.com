// src/pages/simulation/standards/hooks/useApplyStandard.js
//
// V5: Использует isStandardCp helper из controlPointsGenerator.js
// Поддерживает оба формата CP — с meta и со top-level source.

import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectLandmarks } from "../../store/simulationSlice.js";
import { solveTargetLandmarks } from "../services/targetLandmarkSolver.js";
import { solveTargetFromCanonical } from "../canonical/canonicalSolver.js";
import {
  generateControlPoints,
  summarizeControlPoints,
  isStandardCp,
} from "../services/controlPointsGenerator.js";
import {
  detectFaceView,
  isStandardApplicableToView,
} from "../services/viewDetection.js";
import { getStandardById } from "../data/index.js";

export function useApplyStandard({ standardId, points, commitPoints }) {
  const landmarks = useSelector(selectLandmarks);

  const standard = useMemo(
    () => (standardId ? getStandardById(standardId) : null),
    [standardId],
  );

  const safePoints = useMemo(
    () => (Array.isArray(points) ? points : []),
    [points],
  );

  const isApplied = useMemo(() => {
    if (!standardId) return false;
    return safePoints.some((cp) => isStandardCp(cp, standardId));
  }, [safePoints, standardId]);

  const apply = useCallback(() => {
    if (!standard) return { success: false, reason: "no-standard" };
    if (typeof commitPoints !== "function")
      return { success: false, reason: "no-commit-fn" };
    if (!Array.isArray(landmarks) || landmarks.length === 0)
      return { success: false, reason: "no-landmarks" };

    const view = detectFaceView(landmarks);
    if (!isStandardApplicableToView(view.view, standard)) {
      return {
        success: false,
        reason: "view-mismatch",
        currentView: view.view,
        applicableViews: standard.applicableViews,
      };
    }

    let displacements;
    if (standard.isCanonical) {
      displacements = solveTargetFromCanonical({
        landmarks,
        sex: standard.canonicalSex || standard.sex || "female",
        options: { amplification: 1.0 },
      });
    } else {
      displacements = solveTargetLandmarks({ landmarks, standard });
    }

    if (displacements.length === 0) {
      return { success: false, reason: "no-displacements" };
    }

    const standardPoints = generateControlPoints({ displacements, standardId });
    if (standardPoints.length === 0) {
      return { success: false, reason: "no-control-points" };
    }

    const preserved = safePoints.filter((cp) => !isStandardCp(cp, standardId));
    const merged = [...preserved, ...standardPoints];

    // eslint-disable-next-line no-console
    console.info(
      "[useApplyStandard] applying:",
      standardId,
      "| canonical:",
      !!standard.isCanonical,
      "| view:",
      view.view,
      "| displacements:",
      displacements.length,
      "| new CPs:",
      standardPoints.length,
      "| total:",
      merged.length,
    );

    commitPoints(merged, { action: "apply-standard" });
    return {
      success: true,
      summary: summarizeControlPoints(standardPoints),
      displacements,
      controlPoints: standardPoints,
    };
  }, [standard, standardId, landmarks, safePoints, commitPoints]);

  const clear = useCallback(() => {
    if (!standardId || typeof commitPoints !== "function") return;
    const filtered = safePoints.filter((cp) => !isStandardCp(cp, standardId));
    commitPoints(filtered, { action: "clear-standard" });
  }, [standardId, safePoints, commitPoints]);

  const clearAllStandards = useCallback(() => {
    if (typeof commitPoints !== "function") return;
    const filtered = safePoints.filter((cp) => !isStandardCp(cp));
    commitPoints(filtered, { action: "clear-all-standards" });
  }, [safePoints, commitPoints]);

  const summary = useMemo(() => {
    const ownCps = safePoints.filter((cp) => isStandardCp(cp, standardId));
    return summarizeControlPoints(ownCps);
  }, [safePoints, standardId]);

  return { apply, clear, clearAllStandards, isApplied, summary };
}
