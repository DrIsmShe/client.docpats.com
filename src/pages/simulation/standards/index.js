// src/pages/simulation/standards/index.js

/* ────── Data ────── */
export {
  STANDARDS,
  CATEGORIES,
  RHINOPLASTY_STANDARDS,
  MAMMOPLASTY_STANDARDS,
  getStandardById,
  listStandardsByCategory,
  listAllStandards,
} from "./data/index.js";

/* ────── Canonical face data ────── */
export {
  IDEAL_FEMALE,
  IDEAL_MALE,
  IDEAL_FACES,
  getIdealFace,
} from "./canonical/idealFace.js";
export { solveTargetFromCanonical } from "./canonical/canonicalSolver.js";

/* ────── Profile measurements ────── */
export {
  computeExtendedMeasurements,
  computeNasofacialAngle,
  computeCrumleyTriangle,
} from "./services/extendedMeasurements.js";

/* ────── Frontal measurements ────── */
export {
  computeFrontalMeasurements,
  computeAlarToCanthalRatio,
  computeNasalToMouthRatio,
  computeMidlineDeviation,
  computeAlarSymmetry,
} from "./services/frontalMeasurements.js";

/* ────── Breast measurements ────── */
export { computeBreastMeasurements } from "./services/breastMeasurements.js";

/* ────── View detection ────── */
export {
  VIEW,
  detectFaceView,
  isViewApplicable,
  isStandardApplicableToView,
} from "./services/viewDetection.js";

/* ────── Evaluator ────── */
export {
  STATUS,
  evaluateAgainstStandard,
  summarizeEvaluation,
} from "./services/standardEvaluator.js";

/* ────── Solver ────── */
export {
  solveTargetLandmarks,
  applyDisplacementsToLandmarks,
} from "./services/targetLandmarkSolver.js";

/* ────── Generator ────── */
export {
  generateControlPoints,
  summarizeControlPoints,
} from "./services/controlPointsGenerator.js";

/* ────── Hooks ────── */
export { useStandardEvaluation } from "./hooks/useStandardEvaluation.js";
export { useApplyStandard } from "./hooks/useApplyStandard.js";

/* ────── Manual landmark wizard ────── */
export { useStandardsLandmarkWizard } from "./wizard/useStandardsLandmarkWizard.js";
export { default as StandardsLandmarkWizardOverlay } from "./wizard/StandardsLandmarkWizardOverlay.jsx";

/* ────── Components ────── */
export { default as ApplyStandardPanel } from "./components/ApplyStandardPanel.jsx";
export { default as StandardSelector } from "./components/StandardSelector.jsx";
export { default as StandardEvaluationCard } from "./components/StandardEvaluationCard.jsx";
