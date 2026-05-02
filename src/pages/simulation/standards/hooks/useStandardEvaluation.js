// src/pages/simulation/standards/hooks/useStandardEvaluation.js

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectLandmarks } from "../../store/simulationSlice.js";
import { computeAllMeasurements } from "../../mediapipe/measurements.js";
import { computeExtendedMeasurements } from "../services/extendedMeasurements.js";
import { computeFrontalMeasurements } from "../services/frontalMeasurements.js";
import { computeBreastMeasurements } from "../services/breastMeasurements.js";
import {
  evaluateAgainstStandard,
  summarizeEvaluation,
} from "../services/standardEvaluator.js";
import {
  detectFaceView,
  isViewApplicable,
  isStandardApplicableToView,
  VIEW,
} from "../services/viewDetection.js";
import { getStandardById } from "../data/index.js";

export function useStandardEvaluation({
  standardId,
  category,
  breastAnchors = null,
  breastCalibration = null,
}) {
  const landmarks = useSelector(selectLandmarks);

  const standard = useMemo(
    () => (standardId ? getStandardById(standardId) : null),
    [standardId],
  );

  const viewInfo = useMemo(() => {
    if (category !== "rhinoplasty") {
      return { view: VIEW.UNKNOWN, ratio: null, confidence: 0 };
    }
    return detectFaceView(landmarks);
  }, [category, landmarks]);

  const applicableViews = standard?.applicableViews ?? null;
  const viewMatches = isViewApplicable(viewInfo.view, applicableViews);

  const measurements = useMemo(() => {
    if (!standard) return {};

    if (category === "rhinoplasty") {
      const base = computeAllMeasurements(landmarks);
      const ext = computeExtendedMeasurements(landmarks);
      const front = computeFrontalMeasurements(landmarks);
      return { ...base, ...ext, ...front };
    }

    if (category === "mammoplasty") {
      return computeBreastMeasurements(breastAnchors, breastCalibration);
    }

    return {};
  }, [category, landmarks, breastAnchors, breastCalibration, standard]);

  const results = useMemo(() => {
    if (!standard) return [];
    return evaluateAgainstStandard({ measurements, standardId });
  }, [measurements, standardId, standard]);

  const summary = useMemo(() => summarizeEvaluation(results), [results]);

  const hasInputs =
    category === "rhinoplasty"
      ? Array.isArray(landmarks) && landmarks.length > 0
      : Boolean(
          breastAnchors?.sternalNotch &&
          breastAnchors?.nippleL &&
          breastAnchors?.nippleR,
        );

  return {
    results,
    summary,
    standard,
    hasInputs,
    currentView: viewInfo.view,
    viewRatio: viewInfo.ratio,
    viewConfidence: viewInfo.confidence,
    applicableViews,
    viewMatches,
    // также пробрасываем helper если кому-то нужен
    isStandardApplicableToView,
  };
}
