// src/pages/simulation/standards/services/viewDetection.js
//
// Face View Detection — определяет ракурс лица по landmarks.

const IDX = {
  CANTHUS_OUTER_L: 33,
  CANTHUS_OUTER_R: 263,
  CANTHUS_INNER_L: 133,
  CANTHUS_INNER_R: 362,
};

function findByIndex(landmarks, mpIndex) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks.find((lm) => lm.mediapipeIndex === mpIndex) || null;
}

function distance2D(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export const VIEW = Object.freeze({
  FRONTAL: "frontal",
  PROFILE: "profile",
  THREE_QUARTER: "three_quarter",
  UNKNOWN: "unknown",
});

export function detectFaceView(landmarks) {
  const lOuter = findByIndex(landmarks, IDX.CANTHUS_OUTER_L);
  const rOuter = findByIndex(landmarks, IDX.CANTHUS_OUTER_R);
  const lInner = findByIndex(landmarks, IDX.CANTHUS_INNER_L);
  const rInner = findByIndex(landmarks, IDX.CANTHUS_INNER_R);

  if (!lOuter || !rOuter || !lInner || !rInner) {
    return { view: VIEW.UNKNOWN, ratio: null, confidence: 0 };
  }

  const eyeSpan = Math.abs(rOuter.x - lOuter.x);
  const interCanthal = distance2D(lInner, rInner);
  if (interCanthal === 0) {
    return { view: VIEW.UNKNOWN, ratio: null, confidence: 0 };
  }

  const ratio = eyeSpan / interCanthal;

  if (ratio < 1.7) {
    const confidence = Math.min(1, (1.7 - ratio) / 0.7);
    return { view: VIEW.PROFILE, ratio, confidence };
  }
  if (ratio > 2.4) {
    const confidence = Math.min(1, (ratio - 2.4) / 0.6);
    return { view: VIEW.FRONTAL, ratio, confidence };
  }
  return { view: VIEW.THREE_QUARTER, ratio, confidence: 0.5 };
}

/**
 * Совместим ли текущий ракурс со списком применимых ракурсов стандарта.
 *
 * @param {string} currentView                  - VIEW.*
 * @param {string[]|null} applicableViews       - массив из стандарта или null
 * @returns {boolean}
 */
export function isViewApplicable(currentView, applicableViews) {
  if (!applicableViews || !Array.isArray(applicableViews)) return true;
  if (currentView === VIEW.UNKNOWN) return true;
  return applicableViews.includes(currentView);
}

/**
 * Wrapper-алиас: принимает целиком стандарт.
 */
export function isStandardApplicableToView(currentView, standard) {
  return isViewApplicable(currentView, standard?.applicableViews);
}

/**
 * Legacy API.
 */
export function isViewCompatible(currentView, requiredView) {
  if (!requiredView) return true;
  if (currentView === VIEW.UNKNOWN) return true;
  if (currentView === VIEW.THREE_QUARTER) return true;
  return currentView === requiredView;
}
