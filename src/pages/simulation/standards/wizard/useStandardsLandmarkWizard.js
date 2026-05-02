// src/pages/simulation/standards/wizard/useStandardsLandmarkWizard.js
//
// Standalone manual landmark wizard для системы стандартов.
// Не зависит от существующего useManualLandmarkWizard в проекте.
//
// LIFECYCLE:
//   idle → started → collecting (1...6) → completed → idle
//
// При completed — диспатчит landmarks через setLandmarksFromManualFit,
// существующая система их подхватит (LandmarksOverlay, MeasurementsPanel,
// и наша панель стандартов).

import { useCallback, useState, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { setLandmarksFromManualFit } from "../../store/simulationSlice.js";
import { ANCHOR_POINTS } from "../../mediapipe/canonicalAnchorPoints.js";
import { buildLandmarksFromClicks } from "./canonicalMesh.js";

export function useStandardsLandmarkWizard() {
  const dispatch = useDispatch();

  // [{ key, x, y }, ...] — собранные клики в порядке ANCHOR_POINTS
  const [clicks, setClicks] = useState([]);
  const [active, setActive] = useState(false);
  const cancelledRef = useRef(false);

  const totalSteps = ANCHOR_POINTS.length;
  const currentStepIndex = clicks.length;
  const isComplete = clicks.length === totalSteps;

  const currentAnchor = useMemo(() => {
    if (!active || isComplete) return null;
    return ANCHOR_POINTS[currentStepIndex] || null;
  }, [active, isComplete, currentStepIndex]);

  const start = useCallback(() => {
    cancelledRef.current = false;
    setClicks([]);
    setActive(true);
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setClicks([]);
    setActive(false);
  }, []);

  /**
   * Зарегистрировать клик в текущем шаге.
   * @param {{x:number, y:number}} normPoint - нормализованные координаты [0..1]
   */
  const registerClick = useCallback(
    (normPoint) => {
      if (!active || cancelledRef.current) return;
      if (!normPoint || typeof normPoint.x !== "number") return;

      setClicks((prev) => {
        if (prev.length >= totalSteps) return prev;
        const anchor = ANCHOR_POINTS[prev.length];
        return [
          ...prev,
          {
            key: anchor.key,
            x: Math.max(0, Math.min(1, normPoint.x)),
            y: Math.max(0, Math.min(1, normPoint.y)),
          },
        ];
      });
    },
    [active, totalSteps],
  );

  /**
   * Откат на один шаг назад (если врач передумал).
   */
  const undoLastClick = useCallback(() => {
    setClicks((prev) => prev.slice(0, -1));
  }, []);

  /**
   * Финализировать: вызывается автоматически после 6-го клика.
   * Генерирует landmarks через Procrustes и диспатчит в Redux.
   */
  const finalize = useCallback(() => {
    if (clicks.length !== totalSteps) return false;

    const landmarks = buildLandmarksFromClicks(clicks);
    if (landmarks.length === 0) return false;

    dispatch(setLandmarksFromManualFit(landmarks));
    setActive(false);
    setClicks([]);
    return true;
  }, [clicks, totalSteps, dispatch]);

  return {
    // state
    active,
    clicks,
    currentStepIndex,
    totalSteps,
    isComplete,
    currentAnchor,

    // actions
    start,
    cancel,
    registerClick,
    undoLastClick,
    finalize,
  };
}
